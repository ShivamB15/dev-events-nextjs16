import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

import connectDB from "@/lib/mongodb";
import Event from "@/database/event.model";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const formData = await req.formData();

        let event;

        event = Object.fromEntries(formData.entries());

        const file = formData.get('image') as File;

        if (!file) return NextResponse.json({ message: 'Image file is required' }, { status: 400 });

        let tags = JSON.parse(formData.get('tags') as string);
        let agenda = JSON.parse(formData.get('agenda') as string);


        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ message: 'Invalid file type. Only images are allowed.' }, { status: 400 });
        }

        // Validate file size (e.g., 5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          return NextResponse.json({ message: 'File size exceeds 5MB limit.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent'}, (error, result) => {
                if (error) return reject(error);

                resolve(result);
            }).end(buffer);
        });

        if (!uploadResult || typeof uploadResult !== 'object' || !('secure_url' in uploadResult)) {
          return NextResponse.json({ message: 'Image upload failed - invalid response' }, { status: 500 });
        }

        event.image = (uploadResult as { secure_url: string }).secure_url;

        const createdEvent = await Event.create({
            ...event,
            tags: tags,
            agenda: agenda,
        });

        return NextResponse.json({ message: 'Event created successfully', event: createdEvent }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({message:"Event Creation Failed", error : e instanceof Error ? e.message : "Unknown"}, { status: 500 });
    }
}

export async function GET() {
    try {
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: 'Events fetched successfully', events }, { status: 200});
    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Event fetching failed', error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
    }
}

