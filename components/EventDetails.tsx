import { notFound } from "next/navigation";
import Image from "next/image";
import BookEvent from "@/components/BookEvent";
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import { IEvent } from "@/database";
import EventCard from "@/components/EventCard";
import {cacheLife} from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_BASE_URL environment variable is not defined");
}

const EventDetailItem = ({ icon, alt, label }: { icon: string; alt: string; label: string }) => (
    <div className="flex flex-row gap-2 items-center">
        <Image src={icon} alt={alt} width={17} height={17} />
        <p>{label}</p>
    </div>
);

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
    <div className="agenda">
        <h2>Agenda</h2>
        <ul>
            {agendaItems.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
            ))}
        </ul>
    </div>
);

const EventTags = ({ tags }: { tags: string[] }) => (
    <div className="flex flex-row gap-1.5 flex-wrap">
        {tags.map((tag, index) => (
            <div className="pill" key={`${tag}-${index}`}>
                {tag}
            </div>
        ))}
    </div>
);

type PageProps = { params: { slug: string } };

function parseMaybeJsonArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        // try JSON parse first
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed.map(String);
        } catch {
            // not JSON — fallthrough
        }
        // fallback: comma separated
        return value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return [];
}


const EventDetails = async ({ params }: { params: Promise<string>}) => {
    'use cache'
    cacheLife('hours');
    const slug = await params;

    // fetch event from your API
    const res = await fetch(`${BASE_URL}/api/events/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (res.status === 404) return notFound();
    if (!res.ok) {
        throw new Error(`Failed to fetch event (status: ${res.status})`);
    }

    const json: any = await res.json();
    let event: any = json?.event;
    if (!event) return notFound();

    // destructure for convenience but keep the `event` object for BookEvent
    const {
        description,
        image,
        overview,
        date,
        time,
        location,
        mode,
        agenda,
        audience,
        tags,
        organizer,
        slug: eventSlug,
    } = event;

    // validate required fields
    if (
        !description ||
        !image ||
        !overview ||
        !date ||
        !time ||
        !location ||
        !mode ||
        !agenda ||
        !audience ||
        !tags ||
        !organizer
    ) {
        return notFound();
    }

    // parse agenda/tags that may be JSON strings or arrays or CSV strings
    const agendaItems = parseMaybeJsonArray(agenda);
    const tagItems = parseMaybeJsonArray(tags);

    // bookings stub (replace with real logic)
    const bookings = 10;

    // fetch similar events (your helper)
    const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug);

    // prefer Mongo's _id if present
    const eventId = event._id ?? event.id ?? null;

    return (
        <section id="event">
            <div className="header">
                <h1>Event Description</h1>
                <p>{description}</p>
            </div>

            <div className="details">
                {/* Left Side */}
                <div className="content">
                    {/* if image is external, ensure next.config.js allows the host or use unoptimized */}
                    <Image src={image} alt="Event Banner" width={800} height={800} className="banner" />

                    <section className="flex-col-gap-2">
                        <h2>Overview</h2>
                        <p>{overview}</p>
                    </section>

                    <section className="flex-col-gap-2">
                        <h2>Event Details</h2>
                        <EventDetailItem icon="/icons/calendar.svg" alt="calendar" label={date} />
                        <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />
                        <EventDetailItem icon="/icons/pin.svg" alt="pin" label={location} />
                        <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
                        <EventDetailItem icon="/icons/audience.svg" alt="audience" label={audience} />
                    </section>

                    {agendaItems.length > 0 && <EventAgenda agendaItems={agendaItems} />}

                    <section className="flex-col-gap-2">
                        <h2>About the Organizer</h2>
                        <p>{organizer}</p>
                    </section>

                    {tagItems.length > 0 && <EventTags tags={tagItems} />}
                </div>

                {/* Right Side - Booking */}
                <aside className="booking">
                    <div className="signup-card">
                        <h2>Book Your Spot</h2>
                        {bookings > 0 ? (
                            <p className="text-sm">Join {bookings} people who have already booked their spot!</p>
                        ) : (
                            <p className="text-sm">Be the first to book your spot!</p>
                        )}

                        {/* pass eventId (may be null) and slug */}
                        <BookEvent eventId={eventId} slug={eventSlug ?? slug} />
                    </div>
                </aside>
            </div>

            <div className="flex w-full flex-col gap-4 pt-20">
                <h2>Similar Events</h2>
                <div className="events">
                    {similarEvents.length > 0 &&
                        similarEvents.map((similarEvent: IEvent) => <EventCard key={similarEvent.title} {...similarEvent} />)}
                </div>
            </div>
        </section>
    );
}
export default EventDetails