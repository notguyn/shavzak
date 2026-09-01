import { z } from "zod"

// Zod v4: error map receives one argument (issue only, no ctx)
z.setErrorMap((issue) => {
  switch (issue.code) {
    case "too_small":
      if (issue.origin === "string") return { message: "tooShort" }
      if (issue.origin === "number" || issue.origin === "array") return { message: "tooSmall" }
      break
    case "too_big":
      if (issue.origin === "string") return { message: "tooLong" }
      if (issue.origin === "number" || issue.origin === "array") return { message: "tooBig" }
      break
    case "invalid_type":
      return { message: "required" }
  }
  return { message: "invalid" }
})
