import { describe, it, expect, beforeEach, vi } from "vitest";
import * as authService from "./auth";
import * as db from "./db";

// Mock db module
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createUserWithPassword: vi.fn(),
  updateUserPassword: vi.fn(),
  updateUserLastSignedIn: vi.fn(),
}));

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "testPassword123";
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should generate different hashes for the same password", async () => {
      const password = "testPassword123";
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should verify a correct password", async () => {
      const password = "testPassword123";
      const hash = await authService.hashPassword(password);

      const isValid = await authService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const password = "testPassword123";
      const hash = await authService.hashPassword(password);

      const isValid = await authService.verifyPassword("wrongPassword", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("loginWithEmail", () => {
    it("should return null if user not found", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(undefined);

      const result = await authService.loginWithEmail(
        "nonexistent@example.com",
        "password123"
      );

      expect(result).toBeNull();
    });

    it("should return null if user has no password hash", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        passwordHash: null,
        isActive: true,
        role: "user",
      } as any);

      const result = await authService.loginWithEmail(
        "test@example.com",
        "password123"
      );

      expect(result).toBeNull();
    });

    it("should return null if user is inactive", async () => {
      const hash = await authService.hashPassword("password123");
      vi.mocked(db.getUserByEmail).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        passwordHash: hash,
        isActive: false,
        role: "user",
      } as any);

      const result = await authService.loginWithEmail(
        "test@example.com",
        "password123"
      );

      expect(result).toBeNull();
    });

    it("should return null if password is incorrect", async () => {
      const hash = await authService.hashPassword("correctPassword");
      vi.mocked(db.getUserByEmail).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        name: "Test User",
        passwordHash: hash,
        isActive: true,
        role: "user",
      } as any);

      const result = await authService.loginWithEmail(
        "test@example.com",
        "wrongPassword"
      );

      expect(result).toBeNull();
    });

    it("should return user data if credentials are correct", async () => {
      const password = "correctPassword";
      const hash = await authService.hashPassword(password);
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        passwordHash: hash,
        isActive: true,
        role: "power_company" as const,
        companyName: "Test Company",
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(db.updateUserLastSignedIn).mockResolvedValue(undefined);

      const result = await authService.loginWithEmail(
        "test@example.com",
        password
      );

      expect(result).not.toBeNull();
      expect(result?.user).toBeDefined();
      expect(result?.user.email).toBe("test@example.com");
      expect(result?.user.name).toBe("Test User");
      expect(vi.mocked(db.updateUserLastSignedIn)).toHaveBeenCalledWith(1);
    });
  });

  describe("createUser", () => {
    it("should create a user with hashed password", async () => {
      const userData = {
        email: "newuser@example.com",
        name: "New User",
        password: "securePassword123",
        role: "power_company" as const,
        companyName: "New Company",
      };

      const mockCreatedUser = {
        id: 2,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        companyName: userData.companyName,
      };

      vi.mocked(db.createUserWithPassword).mockResolvedValue(
        mockCreatedUser as any
      );

      const result = await authService.createUser(userData);

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(vi.mocked(db.createUserWithPassword)).toHaveBeenCalled();

      // Verify that password was hashed (not passed as plain text)
      const callArgs = vi.mocked(db.createUserWithPassword).mock.calls[0][0];
      expect(callArgs.passwordHash).toBeDefined();
      expect(callArgs.passwordHash).not.toBe(userData.password);
    });
  });

  describe("changePassword", () => {
    it("should return false if user not found", async () => {
      vi.mocked(db.getUserById).mockResolvedValue(undefined);

      const result = await authService.changePassword(
        1,
        "oldPassword",
        "newPassword"
      );

      expect(result).toBe(false);
    });

    it("should return false if old password is incorrect", async () => {
      const oldHash = await authService.hashPassword("correctOldPassword");
      vi.mocked(db.getUserById).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        passwordHash: oldHash,
      } as any);

      const result = await authService.changePassword(
        1,
        "wrongOldPassword",
        "newPassword"
      );

      expect(result).toBe(false);
    });

    it("should update password if old password is correct", async () => {
      const oldPassword = "correctOldPassword";
      const oldHash = await authService.hashPassword(oldPassword);
      vi.mocked(db.getUserById).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        passwordHash: oldHash,
      } as any);
      vi.mocked(db.updateUserPassword).mockResolvedValue(undefined);

      const result = await authService.changePassword(
        1,
        oldPassword,
        "newPassword123"
      );

      expect(result).toBe(true);
      expect(vi.mocked(db.updateUserPassword)).toHaveBeenCalledWith(
        1,
        expect.any(String)
      );
    });
  });

  describe("resetPassword", () => {
    it("should reset password", async () => {
      vi.mocked(db.updateUserPassword).mockResolvedValue(undefined);

      const result = await authService.resetPassword(1, "newPassword123");

      expect(result).toBe(true);
      expect(vi.mocked(db.updateUserPassword)).toHaveBeenCalledWith(
        1,
        expect.any(String)
      );
    });
  });
});
