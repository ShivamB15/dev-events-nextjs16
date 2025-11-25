import { Schema, model, models, Document, Types } from 'mongoose';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Validate that the referenced event exists
BookingSchema.pre('save', async function (next) {
  // Only validate eventId if it's modified or this is a new document
  if (this.isModified('eventId')) {
    try {
      // Dynamically import Event model to avoid circular dependency
      const Event = (await import('./event.model')).default;
      
      const eventExists = await Event.findById(this.eventId);
      
      if (!eventExists) {
        return next(
          new Error(`Event with ID ${this.eventId} does not exist`)
        );
      }
    } catch (error) {
      return next(
        error instanceof Error ? error : new Error('Error validating event')
      );
    }
  }

  next();
});

// Create index on eventId for faster queries
BookingSchema.index({ eventId: 1 });

// Use existing model if it exists (prevents recompilation errors in development)
const Booking = models.Booking || model<IBooking>('Booking', BookingSchema);

export default Booking;
