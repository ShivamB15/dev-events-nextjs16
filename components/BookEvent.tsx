'use client';

import { useState, FormEvent } from "react";
import {createBooking} from "@/lib/actions/booking.actions";
import posthog from "posthog-js";

const BookEvent = ({ eventId, slug }: {eventId: string | null, slug: string;}) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!eventId) {
            console.error('Cannot create booking: missing eventId');
            setError('Unable to book this event right now. Please try again later.');
            posthog.captureException('Booking creation failed: missing eventId');
            return;
        }

        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }

        try {
            setLoading(true);
            const { success, message } = await createBooking({ eventId, slug, email});

            if(success) {
                setSubmitted(true);
                posthog.capture('event-booked', { eventId, slug, email });
            } else {
                console.warn('Booking creation failed', message);
                setError(message || 'Booking could not be completed. Please try again.');
                posthog.captureException(`Booking creation failed: ${message ?? 'no message'}`);
            }
        } catch (err) {
            console.error('Unexpected error during booking:', err);
            setError('An unexpected error occurred. Please try again.');
            posthog.captureException('Unexpected error during booking');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div id="book-event">
            {submitted ? (
                <p className="text-sm">Thank you for signing up!</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 mt-2">{error}</p>
                    )}

                    <button type="submit" className="button-submit" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            )}
        </div>
    )
}
export default BookEvent
