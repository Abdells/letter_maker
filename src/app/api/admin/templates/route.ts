import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LetterTemplate from '@/models/LetterTemplate';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Fetch single template for edit
      const template = await (LetterTemplate as any).findById(id).lean();
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json(template);
    } else {
      // Fetch all templates for list
      const templates = await (LetterTemplate as any).find({}).lean();
      return NextResponse.json(templates);
    }
  } catch (error: any) {
    console.error('Admin templates GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    console.log('POST received:', body);

    if (!body.title || !body.category || !body.type || !body.content) {
      return NextResponse.json({ error: 'Missing required fields (title, category, type, content)' }, { status: 400 });
    }

    const newTemplate = await (LetterTemplate as any).create({
      category: body.category,
      type: body.type,
      title: body.title,
      content: body.content,
      placeholders: body.placeholders || []
    });

    console.log('Created template:', newTemplate);

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error: any) {
    console.error('Admin templates POST error:', error);
    return NextResponse.json({ error: 'Failed to create template: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    if (updates.placeholders && typeof updates.placeholders === 'string') {
      updates.placeholders = updates.placeholders.split(',').map((p: string) => p.trim());
    }

    const updated = await (LetterTemplate as any).findByIdAndUpdate(
      id,
      { ...updates },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Admin templates PUT error:', error);
    return NextResponse.json({ error: 'Failed to update template: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const deleted = await (LetterTemplate as any).findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
