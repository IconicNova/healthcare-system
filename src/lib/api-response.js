import { NextResponse } from 'next/server';

export const ApiResponse = {
  success: (data, status = 200) => {
    // If data is just a message string, format it as { message }
    if (typeof data === 'string') {
      return NextResponse.json({ message: data }, { status });
    }
    return NextResponse.json(data, { status });
  },

  error: (message, status = 400, details = null) => {
    const payload = { error: message };
    if (details) {
      payload.details = details;
    }
    return NextResponse.json(payload, { status });
  },

  unauthorized: (message = 'Unauthorized') => {
    return NextResponse.json({ error: message }, { status: 401 });
  },

  forbidden: (message = 'Forbidden') => {
    return NextResponse.json({ error: message }, { status: 403 });
  },

  notFound: (message = 'Not found') => {
    return NextResponse.json({ error: message }, { status: 404 });
  },

  serverError: (message = 'Internal server error', error = null) => {
    if (error) {
      console.error(message, error);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
