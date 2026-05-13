"""Persona preset storage."""

from typing import Any, Optional

from bson import ObjectId

from src.infra.utils.datetime import utc_now
from src.kernel.config import settings


class PersonaPresetStorage:
    """MongoDB storage for persona presets."""

    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        """Lazy MongoDB collection."""
        if self._collection is None:
            from src.infra.storage.mongodb import get_mongo_client

            client = get_mongo_client()
            db = client[settings.MONGODB_DB]
            self._collection = db["persona_presets"]
        return self._collection

    @property
    def preference_collection(self):
        """Lazy MongoDB collection for per-user preset preferences."""
        from src.infra.storage.mongodb import get_mongo_client

        client = get_mongo_client()
        db = client[settings.MONGODB_DB]
        return db["persona_preset_preferences"]

    _REQUIRED_DEFAULTS: dict[str, Any] = {
        "name": "Untitled",
        "description": "",
        "tags": [],
        "system_prompt": "You are a helpful assistant.",
        "starter_prompts": [],
        "skill_names": [],
        "visibility": "private",
        "status": "draft",
        "is_favorite": False,
        "is_pinned": False,
        "last_used_at": None,
    }

    @classmethod
    def _to_model_dict(cls, doc: dict[str, Any]) -> dict[str, Any]:
        result = dict(doc)
        if "_id" in result:
            result["id"] = str(result.pop("_id"))
        for key, default in cls._REQUIRED_DEFAULTS.items():
            if result.get(key) is None:
                result[key] = default
        return result

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        now = utc_now()
        doc = {
            **data,
            "created_at": data.get("created_at") or now,
            "updated_at": data.get("updated_at") or now,
        }
        result = await self.collection.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        return doc

    async def insert_many(self, docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
        now = utc_now()
        for doc in docs:
            doc.setdefault("created_at", now)
            doc.setdefault("updated_at", now)
        result = await self.collection.insert_many(docs)
        for doc, inserted_id in zip(docs, result.inserted_ids):
            doc["id"] = str(inserted_id)
        return docs

    async def get_by_id(self, preset_id: str) -> Optional[dict[str, Any]]:
        try:
            query_id = ObjectId(preset_id)
        except Exception:
            return None
        doc = await self.collection.find_one({"_id": query_id})
        return self._to_model_dict(doc) if doc else None

    async def list_visible(
        self,
        *,
        user_id: str,
        include_admin: bool = False,
        scope: str | None = None,
        status: str | None = None,
        tag: str | None = None,
        q: str | None = None,
        favorite: bool | None = None,
        pinned: bool | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        query = self._build_visible_query(
            user_id=user_id,
            include_admin=include_admin,
            scope=scope,
            status=status,
            tag=tag,
            q=q,
        )
        cursor = self.collection.find(query)
        docs = [self._to_model_dict(doc) async for doc in cursor]
        docs = await self._apply_user_preferences(user_id, docs)
        docs = self._filter_by_preferences(docs, favorite=favorite, pinned=pinned)
        docs.sort(key=self._preference_sort_key)
        return docs[skip : skip + limit]

    async def count_visible(
        self,
        *,
        user_id: str,
        include_admin: bool = False,
        scope: str | None = None,
        status: str | None = None,
        tag: str | None = None,
        q: str | None = None,
        favorite: bool | None = None,
        pinned: bool | None = None,
    ) -> int:
        query = self._build_visible_query(
            user_id=user_id,
            include_admin=include_admin,
            scope=scope,
            status=status,
            tag=tag,
            q=q,
        )
        if favorite is None and pinned is None:
            return await self.collection.count_documents(query)

        cursor = self.collection.find(query)
        docs = [self._to_model_dict(doc) async for doc in cursor]
        docs = await self._apply_user_preferences(user_id, docs)
        return len(self._filter_by_preferences(docs, favorite=favorite, pinned=pinned))

    async def update(self, preset_id: str, update: dict[str, Any]) -> Optional[dict[str, Any]]:
        try:
            query_id = ObjectId(preset_id)
        except Exception:
            return None
        update = {k: v for k, v in update.items() if v is not None}
        update["updated_at"] = utc_now()
        if not update:
            return await self.get_by_id(preset_id)
        doc = await self.collection.find_one_and_update(
            {"_id": query_id},
            {"$set": update},
            return_document=True,
        )
        return self._to_model_dict(doc) if doc else None

    async def delete(self, preset_id: str) -> bool:
        try:
            query_id = ObjectId(preset_id)
        except Exception:
            return False
        result = await self.collection.delete_one({"_id": query_id})
        return result.deleted_count > 0

    async def increment_usage(self, preset_id: str) -> None:
        try:
            query_id = ObjectId(preset_id)
        except Exception:
            return
        await self.collection.update_one({"_id": query_id}, {"$inc": {"usage_count": 1}})

    async def update_user_preference(
        self,
        *,
        user_id: str,
        preset_id: str,
        update: dict[str, Any],
    ) -> dict[str, Any]:
        now = utc_now()
        allowed = {
            key: value
            for key, value in update.items()
            if key in {"is_favorite", "is_pinned"} and value is not None
        }
        allowed["updated_at"] = now
        result = await self.preference_collection.find_one_and_update(
            {"user_id": user_id, "preset_id": preset_id},
            {
                "$set": allowed,
                "$setOnInsert": {
                    "user_id": user_id,
                    "preset_id": preset_id,
                    "created_at": now,
                },
            },
            upsert=True,
            return_document=True,
        )
        return self._preference_to_dict(result)

    async def touch_user_preference(
        self,
        *,
        user_id: str,
        preset_id: str,
    ) -> dict[str, Any]:
        now = utc_now()
        result = await self.preference_collection.find_one_and_update(
            {"user_id": user_id, "preset_id": preset_id},
            {
                "$set": {
                    "last_used_at": now,
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "user_id": user_id,
                    "preset_id": preset_id,
                    "is_favorite": False,
                    "is_pinned": False,
                    "created_at": now,
                },
            },
            upsert=True,
            return_document=True,
        )
        return self._preference_to_dict(result)

    @staticmethod
    def _preference_to_dict(doc: dict[str, Any] | None) -> dict[str, Any]:
        if not doc:
            return {
                "is_favorite": False,
                "is_pinned": False,
                "last_used_at": None,
            }
        return {
            "is_favorite": bool(doc.get("is_favorite", False)),
            "is_pinned": bool(doc.get("is_pinned", False)),
            "last_used_at": doc.get("last_used_at"),
        }

    async def _apply_user_preferences(
        self,
        user_id: str,
        docs: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        if not docs:
            return docs

        preset_ids = [doc["id"] for doc in docs]
        cursor = self.preference_collection.find(
            {"user_id": user_id, "preset_id": {"$in": preset_ids}}
        )
        preferences = {pref["preset_id"]: self._preference_to_dict(pref) async for pref in cursor}
        for doc in docs:
            doc.update(preferences.get(doc["id"], self._preference_to_dict(None)))
        return docs

    @staticmethod
    def _filter_by_preferences(
        docs: list[dict[str, Any]],
        *,
        favorite: bool | None = None,
        pinned: bool | None = None,
    ) -> list[dict[str, Any]]:
        if favorite is not None:
            docs = [doc for doc in docs if bool(doc.get("is_favorite")) is favorite]
        if pinned is not None:
            docs = [doc for doc in docs if bool(doc.get("is_pinned")) is pinned]
        return docs

    @staticmethod
    def _preference_sort_key(doc: dict[str, Any]) -> tuple:
        last_used = doc.get("last_used_at")
        updated = doc.get("updated_at")
        return (
            0 if doc.get("is_pinned") else 1,
            0 if doc.get("is_favorite") else 1,
            -(last_used.timestamp() if last_used else 0),
            -int(doc.get("usage_count", 0) or 0),
            -(updated.timestamp() if updated else 0),
        )

    @staticmethod
    def _build_visible_query(
        *,
        user_id: str,
        include_admin: bool = False,
        scope: str | None = None,
        status: str | None = None,
        tag: str | None = None,
        q: str | None = None,
    ) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if not include_admin:
            query["$or"] = [
                {"scope": "user", "owner_user_id": user_id},
                {
                    "scope": "global",
                    "visibility": "public",
                    "status": "published",
                },
            ]
        if scope:
            query["scope"] = scope
        if status:
            query["status"] = status
        if tag:
            query["tags"] = tag
        if q:
            query["$and"] = query.get("$and", [])
            query["$and"].append(
                {
                    "$or": [
                        {"name": {"$regex": q, "$options": "i"}},
                        {"description": {"$regex": q, "$options": "i"}},
                    ]
                }
            )
        return query
