import swaggerJsdoc from "swagger-jsdoc";

const servers = [{ url: "http://localhost:4000", description: "Local" }];

export function buildOpenApiSpec() {
  return swaggerJsdoc({
    definition: {
      openapi: "3.0.3",
      info: {
        title: "Task API",
        version: "1.0.0",
        description:
          "Tasks API with JWT auth and USER/ADMIN roles. Send Authorization: Bearer <token> for protected routes.",
      },
      servers,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas: {
          Task: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              description: { type: "string", nullable: true },
              status: { type: "string", enum: ["TODO", "DOING", "DONE"] },
              userId: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          TaskCreate: {
            type: "object",
            required: ["title"],
            properties: {
              title: { type: "string" },
              description: { type: "string", nullable: true },
              status: { type: "string", enum: ["TODO", "DOING", "DONE"] },
            },
          },
          TaskUpdate: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              description: { type: "string", nullable: true },
              status: { type: "string", enum: ["TODO", "DOING", "DONE"] },
            },
          },
        },
      },
    },
    apis: ["./src/modules/**/*.js", "./src/app.js"],
  });
}
