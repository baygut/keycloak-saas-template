import type { WriteAuthorizationModelRequest } from "@openfga/sdk";

/** JSON authorization model — keep in sync with `fga/model.fga`. */
export const blogAuthorizationModel: WriteAuthorizationModelRequest = {
  schema_version: "1.1",
  type_definitions: [
    { type: "user" },
    {
      type: "blog",
      relations: {
        owner: {
          this: {},
        },
        viewer: {
          union: {
            child: [
              { this: {} },
              { computedUserset: { relation: "editor" } },
              { computedUserset: { relation: "admin" } },
              { computedUserset: { relation: "owner" } },
            ],
          },
        },
        editor: {
          union: {
            child: [
              { this: {} },
              { computedUserset: { relation: "admin" } },
              { computedUserset: { relation: "owner" } },
            ],
          },
        },
        admin: {
          union: {
            child: [{ this: {} }, { computedUserset: { relation: "owner" } }],
          },
        },
        can_view: {
          computedUserset: { relation: "viewer" },
        },
        can_edit: {
          computedUserset: { relation: "editor" },
        },
        can_delete: {
          union: {
            child: [
              { computedUserset: { relation: "owner" } },
              { computedUserset: { relation: "admin" } },
            ],
          },
        },
        can_share: {
          union: {
            child: [
              { computedUserset: { relation: "owner" } },
              { computedUserset: { relation: "admin" } },
            ],
          },
        },
      },
      metadata: {
        relations: {
          owner: { directly_related_user_types: [{ type: "user" }] },
          viewer: { directly_related_user_types: [{ type: "user" }] },
          editor: { directly_related_user_types: [{ type: "user" }] },
          admin: { directly_related_user_types: [{ type: "user" }] },
        },
      },
    },
  ],
};
