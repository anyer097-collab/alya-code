import { describe, expect, test } from "bun:test"
import { catalogIdentity } from "./catalog-identity"

describe("stats catalog identity", () => {
  test("resolves Alya Code offerings to canonical labs", () => {
    const identity = catalogIdentity({
      models: { "meituan/longcat-2.5-preview": {} },
      providers: {
        alya-code: { models: { "longcat-2.5-preview-free": { canonical_model_id: "meituan/longcat-2.5-preview" } } },
        "alya-code-go": {
          models: { "longcat-2.5-preview-free": { canonical_model_id: "meituan/longcat-2.5-preview" } },
        },
      },
    })

    expect(identity.offerings.get("alya-code/longcat-2.5-preview-free")).toBe("meituan")
    expect(identity.offerings.get("alya-code-go/longcat-2.5-preview-free")).toBe("meituan")
    expect(identity.models.get("longcat-2.5-preview")).toBe("meituan")
  })

  test("does not guess a lab for a name shared by different canonical models", () => {
    const identity = catalogIdentity({
      models: { "lab-a/model": {}, "lab-b/model": {} },
      providers: {
        alya-code: { models: { "model-free": { canonical_model_id: "lab-a/model" } } },
        "alya-code-go": { models: { model: { canonical_model_id: "lab-b/model" } } },
      },
    })

    expect(identity.offerings.get("alya-code/model-free")).toBe("lab-a")
    expect(identity.offerings.get("alya-code-go/model")).toBe("lab-b")
    expect(identity.models.has("model")).toBe(false)
  })

  test("accepts provider IDs that are already canonical catalog IDs", () => {
    const identity = catalogIdentity({
      models: { "alya-code/direct-model": {} },
      providers: { alya-code: { models: { "direct-model": {} } } },
    })

    expect(identity.offerings.get("alya-code/direct-model")).toBe("alya-code")
    expect(identity.models.get("direct-model")).toBe("alya-code")
  })

  test("rejects a catalog without published canonical identities", () => {
    expect(() => catalogIdentity({ models: {}, providers: { alya-code: { models: { model: {} } } } })).toThrow(
      "Model catalog has no canonical Alya Code offerings",
    )
  })
})
