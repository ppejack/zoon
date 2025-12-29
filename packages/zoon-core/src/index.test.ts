import { describe, test, expect } from "bun:test";
import { encode, decode } from "./index";

describe("Tabular Encoding", () => {
    test("encodes simple array", () => {
        const data = [
            { id: 1, name: "Alice", role: "Admin", active: true },
            { id: 2, name: "Bob", role: "User", active: true },
            { id: 3, name: "Carol", role: "User", active: false },
        ];
        const result = encode(data);
        expect(result.startsWith("#")).toBe(true);
        expect(result).toContain("id:i+");
        expect(result).toContain("Alice");
        expect(result).toContain("Bob");
    });

    test("handles empty array", () => {
        const result = encode([]);
        expect(result).toContain("empty");
    });

    test("handles auto-increment", () => {
        const data = [
            { id: 1, name: "A" },
            { id: 2, name: "B" },
            { id: 3, name: "C" },
        ];
        const result = encode(data);
        expect(result).toContain("id:i+");
    });

    test("handles nulls", () => {
        const data = [
            { id: 1, value: "test" },
            { id: 2, value: null },
        ];
        const result = encode(data);
        expect(result).toContain("~");
    });

    test("handles spaces in strings", () => {
        const data = [{ name: "Hello World" }];
        const result = encode(data);
        expect(result).toContain("Hello_World");
    });

    test("handles floats", () => {
        const data = [
            { name: "cpu", value: 0.75 },
            { name: "mem", value: 0.92 },
        ];
        const result = encode(data);
        expect(result).toContain("0.75");
        expect(result).toContain("0.92");
    });
});

describe("Inline Encoding", () => {
    test("encodes single object", () => {
        const data = { host: "localhost", port: 3000, ssl: true };
        const result = encode(data);
        expect(result).toContain("host=localhost");
        expect(result).toContain("port:3000");
        expect(result).toContain("ssl:y");
    });

    test("encodes nested object", () => {
        const data = {
            server: { host: "localhost", port: 3000 },
            db: { driver: "postgres", host: "db.example.com" },
        };
        const result = encode(data);
        expect(result).toContain("server:");
        expect(result).toContain("db:");
    });
});

describe("Tabular Decoding", () => {
    test("decodes simple tabular", () => {
        const input = `# id:i+ name:s role=Admin|User active:b
Alice Admin 1
Bob User 0`;
        const result = decode(input);
        expect(result.length).toBe(2);
        expect(result[0]?.name).toBe("Alice");
        expect(result[0]?.active).toBe(true);
        expect(result[1]?.active).toBe(false);
    });

    test("decodes nulls", () => {
        const input = `# name:s value:s
Alice test
Bob ~`;
        const result = decode(input);
        expect(result[0]?.value).toBe("test");
        expect(result[1]?.value).toBeNull();
    });

    test("decodes auto-increment", () => {
        const input = `# id:i+ name:s
Alice
Bob
Carol`;
        const result = decode(input);
        expect(result[0]?.id).toBe(1);
        expect(result[1]?.id).toBe(2);
        expect(result[2]?.id).toBe(3);
    });
});

describe("Inline Decoding", () => {
    test("decodes key-value pairs", () => {
        const input = "host=localhost port:3000 ssl:y";
        const result = decode(input);
        expect(result[0]?.host).toBe("localhost");
        expect(result[0]?.port).toBe(3000);
        expect(result[0]?.ssl).toBe(true);
    });

    test("decodes nested objects", () => {
        const input = "server:{host=localhost port:3000} db:{driver=postgres}";
        const result = decode(input);
        expect((result[0]?.server as any).host).toBe("localhost");
        expect((result[0]?.db as any).driver).toBe("postgres");
    });
});

describe("Roundtrip", () => {
    test("roundtrips simple array", () => {
        const data = [
            { id: 1, name: "Alice", role: "Admin" },
            { id: 2, name: "Bob", role: "User" },
        ];
        const encoded = encode(data);
        const decoded = decode(encoded);
        expect(decoded[0]?.name).toBe("Alice");
        expect(decoded[1]?.name).toBe("Bob");
    });

    test("roundtrips with booleans", () => {
        const data = [
            { name: "Alice", active: true },
            { name: "Bob", active: false },
        ];
        const encoded = encode(data);
        const decoded = decode(encoded);
        expect(decoded[0]?.active).toBe(true);
        expect(decoded[1]?.active).toBe(false);
    });

    test("roundtrips with nulls", () => {
        const data = [
            { name: "Alice", email: "alice@example.com" },
            { name: "Bob", email: null },
        ];
        const encoded = encode(data);
        const decoded = decode(encoded);
        expect(decoded[0]?.email).toBe("alice@example.com");
        expect(decoded[1]?.email).toBeNull();
    });

    test("roundtrips with numbers", () => {
        const data = [
            { product: "Widget", price: 19.99, stock: 100 },
            { product: "Gadget", price: 29.50, stock: 50 },
        ];
        const encoded = encode(data);
        const decoded = decode(encoded);
        expect(decoded[0]?.price).toBe(19.99);
        expect(decoded[1]?.stock).toBe(50);
    });
});

describe("Decoding Edge Cases", () => {
    test("decodes booleans", () => {
        const input = `# name:s active:b
Alice 1
Bob 0`;
        const result = decode(input);
        expect(result[0]?.active).toBe(true);
        expect(result[1]?.active).toBe(false);
    });

    test("decodes numbers", () => {
        const input = `# name:s price:i
Widget 1999
Gadget 2950`;
        const result = decode(input);
        expect(result[0]?.price).toBe(1999);
        expect(result[1]?.price).toBe(2950);
    });
});

describe("Token Reduction", () => {
    test("reduces tokens vs JSON", () => {
        const data = Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: `User_${i + 1}`,
            status: "active",
            level: 1,
        }));
        const jsonStr = JSON.stringify(data);
        const zoonStr = encode(data);
        expect(zoonStr.length).toBeLessThan(jsonStr.length);
    });

    test("roundtrips with aliases", () => {
        // Use long prefix to ensure optimization triggers
        const data = [
            { infrastructure: { postgres: { status: "up" }, redis: { status: "up" } } },
            { infrastructure: { postgres: { status: "down" }, redis: { status: "down" } } }
        ];
        const encoded = encode(data);
        expect(encoded).toContain('%'); // Should use aliases
        expect(encoded).toContain('infrastructure'); // In alias definition
        const decoded = decode(encoded);
        expect(decoded).toEqual(data);
    });

    test("roundtrips with constants", () => {
        const data = [
            { status: "ok", id: 1 },
            { status: "ok", id: 2 },
            { status: "ok", id: 3 }
        ];
        const encoded = encode(data);
        expect(encoded).toContain('@status=ok');
        const decoded = decode(encoded);
        expect(decoded).toEqual(data);
    });

    test("roundtrips with constants (numbers/bools)", () => {
        const data = [
            { active: true, version: 1, id: 1 },
            { active: true, version: 1, id: 2 }
        ];
        const encoded = encode(data);
        const decoded = decode(encoded);
        expect(decoded).toEqual(data);
    });

    test("roundtrips with quoted text type", () => {
        const data = [
            { name: "Alice", bio: "This is a long bio with lots of text that should use quoted encoding" },
            { name: "Bob", bio: "Another lengthy biography that exceeds the thirty character threshold" }
        ];
        const encoded = encode(data);
        expect(encoded).toContain('bio:t');
        expect(encoded).toContain('"');
        const decoded = decode(encoded);
        expect(decoded[0]?.bio).toBe("This is a long bio with lots of text that should use quoted encoding");
        expect(decoded[1]?.bio).toBe("Another lengthy biography that exceeds the thirty character threshold");
    });

    test("token estimation (chars/4) shows ZOON savings", () => {
        const estimateTokens = (s: string) => Math.ceil(s.length / 4);
        const data = Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            username: `user_${i + 1}`,
            email: `user${i + 1}@example.com`,
            status: "active",
        }));
        const jsonStr = JSON.stringify(data);
        const zoonStr = encode(data);
        const jsonTokens = estimateTokens(jsonStr);
        const zoonTokens = estimateTokens(zoonStr);
        expect(zoonTokens).toBeLessThan(jsonTokens);
    });
});

describe("Comprehensive Token Efficiency", () => {
    const estimateTokens = (s: string) => Math.ceil(s.length / 4);
    const measureSavings = (data: any) => {
        const jsonStr = JSON.stringify(data);
        const zoonStr = encode(data);
        const jsonTokens = estimateTokens(jsonStr);
        const zoonTokens = estimateTokens(zoonStr);
        return { jsonTokens, zoonTokens, savings: ((1 - zoonTokens / jsonTokens) * 100).toFixed(1) };
    };

    test("short string fields (usernames, codes)", () => {
        const data = Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            code: `PRD${i + 100}`,
            name: `Item${i}`,
            sku: `SKU-${i}`,
        }));
        const { zoonTokens, jsonTokens } = measureSavings(data);
        expect(zoonTokens).toBeLessThan(jsonTokens);
    });

    test("long text fields (bios, descriptions)", () => {
        const data = Array.from({ length: 30 }, (_, i) => ({
            id: i + 1,
            title: `Product ${i}`,
            description: `This is product number ${i} with a comprehensive description that contains lots of details about its features and capabilities`,
            category: ["Electronics", "Home", "Sports"][i % 3],
        }));
        const { zoonTokens, jsonTokens } = measureSavings(data);
        expect(zoonTokens).toBeLessThan(jsonTokens);
        const encoded = encode(data);
        expect(encoded).toContain(':t');
    });

    test("numeric-heavy data (metrics, stats)", () => {
        const data = Array.from({ length: 100 }, (_, i) => ({
            timestamp: 1704067200 + i * 3600,
            cpu: Math.round(Math.random() * 100) / 100,
            memory: Math.round(Math.random() * 100) / 100,
            requests: Math.floor(Math.random() * 10000),
            latency: Math.floor(Math.random() * 500),
        }));
        const { zoonTokens, jsonTokens } = measureSavings(data);
        expect(zoonTokens).toBeLessThan(jsonTokens);
    });

    test("boolean-heavy data (flags, permissions)", () => {
        const data = Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            active: i % 2 === 0,
            verified: i % 3 === 0,
            premium: i % 5 === 0,
            admin: i % 10 === 0,
            deleted: false,
        }));
        const { zoonTokens, jsonTokens } = measureSavings(data);
        expect(zoonTokens).toBeLessThan(jsonTokens);
    });

    test("enum-heavy data (status, role, type)", () => {
        const statuses = ["active", "pending", "inactive", "suspended"];
        const roles = ["admin", "user", "moderator", "guest"];
        const types = ["standard", "premium", "enterprise"];
        const data = Array.from({ length: 60 }, (_, i) => ({
            id: i + 1,
            status: statuses[i % 4],
            role: roles[i % 4],
            type: types[i % 3],
            tier: "basic",
        }));
        const { zoonTokens, jsonTokens } = measureSavings(data);
        expect(zoonTokens).toBeLessThan(jsonTokens);
        const encoded = encode(data);
        expect(encoded).toContain('=');
    });

    test("nested objects (config, settings)", () => {
        const data = Array.from({ length: 20 }, (_, i) => ({
            id: i + 1,
            server: { host: "localhost", port: 3000 + i },
            database: { driver: "postgres", host: "db.local" },
            cache: { enabled: true, ttl: 3600 },
        }));
        const { zoonTokens, jsonTokens } = measureSavings(data);
        expect(zoonTokens).toBeLessThan(jsonTokens);
    });

    test("large dataset (500 rows)", () => {
        const data = Array.from({ length: 500 }, (_, i) => ({
            id: i + 1,
            name: `User${i}`,
            email: `u${i}@test.com`,
            status: i % 2 === 0 ? "active" : "inactive",
            score: i * 10,
        }));
        const { zoonTokens, jsonTokens, savings } = measureSavings(data);
        expect(zoonTokens).toBeLessThan(jsonTokens);
        expect(parseFloat(savings)).toBeGreaterThan(30);
    });

    test("mixed real-world employees data", () => {
        const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance"];
        const data = Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            firstName: `First${i}`,
            lastName: `Last${i}`,
            email: `employee${i}@company.com`,
            department: departments[i % 5],
            salary: 50000 + i * 1000,
            active: true,
            startDate: "2024-01-15",
        }));
        const { zoonTokens, jsonTokens, savings } = measureSavings(data);
        expect(zoonTokens).toBeLessThan(jsonTokens);
        expect(parseFloat(savings)).toBeGreaterThan(25);
    });

    test("E-commerce products data", () => {
        const categories = ["Electronics", "Clothing", "Home", "Sports", "Books"];
        const data = Array.from({ length: 80 }, (_, i) => ({
            id: i + 1,
            name: `Product${i}`,
            price: 19.99 + i,
            stock: 100 - (i % 50),
            category: categories[i % 5],
            featured: i % 10 === 0,
            rating: 3.5 + (i % 15) / 10,
        }));
        const { zoonTokens, jsonTokens, savings } = measureSavings(data);
        expect(zoonTokens).toBeLessThan(jsonTokens);
        expect(parseFloat(savings)).toBeGreaterThan(25);
    });

    test("API logs data", () => {
        const methods = ["GET", "POST", "PUT", "DELETE"];
        const statuses = [200, 201, 400, 404, 500];
        const data = Array.from({ length: 200 }, (_, i) => ({
            id: i + 1,
            method: methods[i % 4],
            path: `/api/v1/resource/${i}`,
            status: statuses[i % 5],
            duration: Math.floor(Math.random() * 1000),
            timestamp: 1704067200 + i,
        }));
        const { zoonTokens, jsonTokens, savings } = measureSavings(data);
        expect(zoonTokens).toBeLessThan(jsonTokens);
        expect(parseFloat(savings)).toBeGreaterThan(20);
    });

    test("roundtrip accuracy for all data types", () => {
        const data = [
            { str: "hello", num: 42, bool: true, float: 3.14 },
            { str: "world", num: 100, bool: false, float: 2.5 },
        ];
        const encoded = encode(data);
        const decoded = decode(encoded);
        expect(decoded[0]?.str).toBe("hello");
        expect(decoded[0]?.num).toBe(42);
        expect(decoded[0]?.bool).toBe(true);
        expect(decoded[1]?.float).toBe(2.5);
    });
});
