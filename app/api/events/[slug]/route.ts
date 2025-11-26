import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

// Type for route params in Next.js 15+
interface RouteParams {
    params: Promise<{
        slug: string;
    }>;
}

/**
 * GET /api/events/[slug]
 * Fetches a single event by its slug
 */
export async function GET(
    _req: NextRequest,
    { params }: RouteParams
) {
    try {
        // Await params as per Next.js 15+ requirements
        const { slug } = await params;

        // Validate slug parameter
        if (!slug || typeof slug !== 'string' || slug.trim() === '') {
            return NextResponse.json(
                { message: 'Invalid or missing slug parameter'},
                { status: 400 }
            );
        }

        // Validate slug format (lowercase alphanumeric with hyphens)
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(slug)) {
            return NextResponse.json(
                {
                    message: 'Invalid slug format',
                    error: 'Slug must contain only lowercase letters, numbers, and hyphens'
                },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Query event by slug
        const event = await Event.findOne({ slug }).lean();

        // Handle event not found
        if (!event) {
            return NextResponse.json(
                {
                    message: 'Event not found',
                    error: `No event exists with slug: ${slug}`
                },
                { status: 404 }
            );
        }

        // Return successful response
        return NextResponse.json(
            {
                message: 'Event fetched successfully',
                event
            },
            { status: 200 }
        );

    } catch (error) {
        // Log error for debugging (in production, use proper logging service)
        console.error('Error fetching event by slug:', error);

        // Handle unexpected errors with a generic message to avoid leaking internals
        return NextResponse.json(
            {
                message: 'Failed to fetch event',
            },
            { status: 500 }
        );
    }
}
