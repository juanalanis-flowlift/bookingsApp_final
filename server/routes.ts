import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBusinessSchema, insertServiceSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";

export async function registerRoutes(server: Server, app: Express): Promise<void> {
  // Auth middleware
  await setupAuth(app);

  // ============================================
  // Auth Routes
  // ============================================
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============================================
  // Business Routes (Protected)
  // ============================================
  app.get("/api/business", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.post("/api/business", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already has a business
      const existing = await storage.getBusinessByOwnerId(userId);
      if (existing) {
        return res.status(400).json({ message: "Business already exists" });
      }

      // Check if slug is unique
      const slugExists = await storage.getBusinessBySlug(req.body.slug);
      if (slugExists) {
        return res.status(400).json({ message: "URL slug already taken" });
      }

      const data = insertBusinessSchema.parse({
        ...req.body,
        ownerId: userId,
      });

      const business = await storage.createBusiness(data);
      res.json(business);
    } catch (error) {
      console.error("Error creating business:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create business" });
    }
  });

  app.patch("/api/business", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Check if new slug is unique (if changed)
      if (req.body.slug && req.body.slug !== business.slug) {
        const slugExists = await storage.getBusinessBySlug(req.body.slug);
        if (slugExists) {
          return res.status(400).json({ message: "URL slug already taken" });
        }
      }

      const updated = await storage.updateBusiness(business.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating business:", error);
      res.status(500).json({ message: "Failed to update business" });
    }
  });

  // ============================================
  // Service Routes (Protected)
  // ============================================
  app.get("/api/services", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const services = await storage.getServicesByBusinessId(business.id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const data = insertServiceSchema.parse({
        ...req.body,
        businessId: business.id,
      });

      const service = await storage.createService(data);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.patch("/api/services/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const service = await storage.getServiceById(req.params.id);
      if (!service || service.businessId !== business.id) {
        return res.status(404).json({ message: "Service not found" });
      }

      const updated = await storage.updateService(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const service = await storage.getServiceById(req.params.id);
      if (!service || service.businessId !== business.id) {
        return res.status(404).json({ message: "Service not found" });
      }

      await storage.deleteService(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // ============================================
  // Availability Routes (Protected)
  // ============================================
  app.get("/api/availability", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const avail = await storage.getAvailabilityByBusinessId(business.id);
      res.json(avail);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post("/api/availability", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const avail = await storage.upsertAvailability({
        ...req.body,
        businessId: business.id,
      });
      res.json(avail);
    } catch (error) {
      console.error("Error saving availability:", error);
      res.status(500).json({ message: "Failed to save availability" });
    }
  });

  // ============================================
  // Blocked Time Routes (Protected)
  // ============================================
  app.get("/api/blocked-times", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const blocked = await storage.getBlockedTimesByBusinessId(business.id);
      res.json(blocked);
    } catch (error) {
      console.error("Error fetching blocked times:", error);
      res.status(500).json({ message: "Failed to fetch blocked times" });
    }
  });

  app.post("/api/blocked-times", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const blocked = await storage.createBlockedTime({
        ...req.body,
        businessId: business.id,
        startDateTime: new Date(req.body.startDateTime),
        endDateTime: new Date(req.body.endDateTime),
      });
      res.json(blocked);
    } catch (error) {
      console.error("Error creating blocked time:", error);
      res.status(500).json({ message: "Failed to create blocked time" });
    }
  });

  app.delete("/api/blocked-times/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      await storage.deleteBlockedTime(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blocked time:", error);
      res.status(500).json({ message: "Failed to delete blocked time" });
    }
  });

  // ============================================
  // Booking Routes (Protected)
  // ============================================
  app.get("/api/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const bookingsList = await storage.getBookingsByBusinessId(business.id);
      res.json(bookingsList);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.patch("/api/bookings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const business = await storage.getBusinessByOwnerId(userId);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const booking = await storage.getBookingById(req.params.id);
      if (!booking || booking.businessId !== business.id) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const updated = await storage.updateBooking(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // ============================================
  // Public Routes (for customer booking page)
  // ============================================
  app.get("/api/public/business/:slug", async (req, res) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.slug);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.get("/api/public/services/:slug", async (req, res) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.slug);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const services = await storage.getServicesByBusinessId(business.id);
      // Only return active services
      res.json(services.filter(s => s.isActive));
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/public/availability/:slug", async (req, res) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.slug);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const avail = await storage.getAvailabilityByBusinessId(business.id);
      res.json(avail);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.get("/api/public/bookings/:slug", async (req, res) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.slug);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Get date from query param
      const dateStr = req.query.date as string;
      if (!dateStr) {
        return res.json([]);
      }

      const date = new Date(dateStr);
      const bookingsList = await storage.getBookingsByDateRange(
        business.id,
        startOfDay(date),
        endOfDay(date)
      );

      // Only return necessary info (not customer details)
      res.json(
        bookingsList.map((b) => ({
          id: b.id,
          serviceId: b.serviceId,
          bookingDate: b.bookingDate,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
        }))
      );
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/public/bookings/:slug", async (req, res) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.slug);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Validate service exists and belongs to business
      const service = await storage.getServiceById(req.body.serviceId);
      if (!service || service.businessId !== business.id) {
        return res.status(400).json({ message: "Invalid service" });
      }

      // Check for double booking
      const bookingDate = new Date(req.body.bookingDate);
      const existingBookings = await storage.getBookingsByDateRange(
        business.id,
        startOfDay(bookingDate),
        endOfDay(bookingDate)
      );

      const hasConflict = existingBookings.some((existing) => {
        if (existing.status === "cancelled") return false;
        return (
          (req.body.startTime >= existing.startTime && req.body.startTime < existing.endTime) ||
          (req.body.endTime > existing.startTime && req.body.endTime <= existing.endTime) ||
          (req.body.startTime <= existing.startTime && req.body.endTime >= existing.endTime)
        );
      });

      if (hasConflict) {
        return res.status(400).json({ message: "Time slot not available" });
      }

      const booking = await storage.createBooking({
        businessId: business.id,
        serviceId: req.body.serviceId,
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        customerPhone: req.body.customerPhone || null,
        customerNotes: req.body.customerNotes || null,
        bookingDate: bookingDate,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        status: "pending",
      });

      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });
}
