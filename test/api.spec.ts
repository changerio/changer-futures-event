import request from "supertest";

import app from "../src/app";

describe("GET /heartbeat", () => {
	it("should return 200 OK", () => {
		return request(app).get("/heartbeat").expect(200);
	});
});
