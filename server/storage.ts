import {
  users,
  businesses,
  services,
  availability,
  blockedTimes,
  bookings,
  type User,
  type UpsertUser,
  type Business,
  type InsertBusiness,
  type Service,
  type InsertService,
  type Availability,
  type InsertAvailability,
  type BlockedTime,
  type InsertBlockedTime,
  type Booking,
  type InsertBooking,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Business operations
  getBusinessByOwnerId(ownerId: string): Promise<Business | undefined>;
  getBusinessBySlug(slug: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business | undefined>;

  // Service operations
  getServicesByBusinessId(businessId: string): Promise<Service[]>;
  getServiceById(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;

  // Availability operations
  getAvailabilityByBusinessId(businessId: string): Promise<Availability[]>;
  upsertAvailability(avail: InsertAvailability): Promise<Availability>;

  // Blocked time operations
  getBlockedTimesByBusinessId(businessId: string): Promise<BlockedTime[]>;
  createBlockedTime(blockedTime: InsertBlockedTime): Promise<BlockedTime>;
  deleteBlockedTime(id: string): Promise<void>;

  // Booking operations
  getBookingsByBusinessId(businessId: string): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | undefined>;
  getBookingsByDateRange(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Business operations
  async getBusinessByOwnerId(ownerId: string): Promise<Business | undefined> {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.ownerId, ownerId));
    return business;
  }

  async getBusinessBySlug(slug: string): Promise<Business | undefined> {
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.slug, slug));
    return business;
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const [created] = await db.insert(businesses).values(business).returning();
    return created;
  }

  async updateBusiness(
    id: string,
    business: Partial<InsertBusiness>
  ): Promise<Business | undefined> {
    const [updated] = await db
      .update(businesses)
      .set({ ...business, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    return updated;
  }

  // Service operations
  async getServicesByBusinessId(businessId: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.businessId, businessId))
      .orderBy(desc(services.createdAt));
  }

  async getServiceById(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [created] = await db.insert(services).values(service).returning();
    return created;
  }

  async updateService(
    id: string,
    service: Partial<InsertService>
  ): Promise<Service | undefined> {
    const [updated] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Availability operations
  async getAvailabilityByBusinessId(businessId: string): Promise<Availability[]> {
    return await db
      .select()
      .from(availability)
      .where(eq(availability.businessId, businessId));
  }

  async upsertAvailability(avail: InsertAvailability): Promise<Availability> {
    // Check if availability exists for this business and day
    const [existing] = await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.businessId, avail.businessId),
          eq(availability.dayOfWeek, avail.dayOfWeek)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(availability)
        .set(avail)
        .where(eq(availability.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(availability).values(avail).returning();
      return created;
    }
  }

  // Blocked time operations
  async getBlockedTimesByBusinessId(businessId: string): Promise<BlockedTime[]> {
    return await db
      .select()
      .from(blockedTimes)
      .where(eq(blockedTimes.businessId, businessId))
      .orderBy(desc(blockedTimes.startDateTime));
  }

  async createBlockedTime(blockedTime: InsertBlockedTime): Promise<BlockedTime> {
    const [created] = await db
      .insert(blockedTimes)
      .values(blockedTime)
      .returning();
    return created;
  }

  async deleteBlockedTime(id: string): Promise<void> {
    await db.delete(blockedTimes).where(eq(blockedTimes.id, id));
  }

  // Booking operations
  async getBookingsByBusinessId(businessId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.businessId, businessId))
      .orderBy(desc(bookings.bookingDate));
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByDateRange(
    businessId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.businessId, businessId),
          gte(bookings.bookingDate, startDate),
          lte(bookings.bookingDate, endDate)
        )
      );
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [created] = await db.insert(bookings).values(booking).returning();
    return created;
  }

  async updateBooking(
    id: string,
    booking: Partial<InsertBooking>
  ): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
