import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LetterTemplate from '@/models/LetterTemplate';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Fetch single template for edit
      const template = await LetterTemplate.findById(id).lean();
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json(template);
    } else {
      // Fetch all templates for list
      const templates = await LetterTemplate.find({}).lean();
      return NextResponse.json(templates);
    }
  } catch (error) {
    console.error('Admin templates GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    console.log('POST received:', body); // Debug: check incoming data

    if (!body.title || !body.category || !body.type || !body.content) {
      return NextResponse.json({ error: 'Missing required fields (title, category, type, content)' }, { status: 400 });
    }

    const newTemplate = await LetterTemplate.create({
      category: body.category,
      type: body.type,
      title: body.title,
      content: body.content,
      placeholders: body.placeholders || []
    });

    console.log('Created template:', newTemplate); // Debug

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('Admin templates POST error:', error);
    return NextResponse.json({ error: 'Failed to create template: ' + error.message }, { status: 500 });
  }

}

//DELETE BUTTON ADDED
export async function DELETE(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const deleted = await LetterTemplate.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}