import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET single entry
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const entry = await prisma.kBEntry.findUnique({
            where: { id },
            include: { chunks: true }
        });

        if (!entry) {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }

        return NextResponse.json(entry);
    } catch (error) {
        console.error('Error fetching entry:', error);
        return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 });
    }
}

// PUT update entry
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const entry = await prisma.kBEntry.update({
            where: { id },
            data: {
                ...body,
                lastReviewed: new Date()
            }
        });

        return NextResponse.json(entry);
    } catch (error) {
        console.error('Error updating entry:', error);
        return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }
}

// DELETE entry
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.kBEntry.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting entry:', error);
        return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
}
