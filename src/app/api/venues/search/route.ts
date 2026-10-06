import { PlacesApiError } from "@/lib/places/client";
import { searchVenues } from "@/lib/places/searchVenues";
import { searchRequestSchema } from "@/lib/venues/searchSchema";

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = searchRequestSchema.safeParse(body);
    if (!parsed.success) {
        return Response.json(
            { error: parsed.error.issues[0]?.message ?? "Invalid search request" },
            { status: 400 },
        );
    }

    try {
        const result = await searchVenues(parsed.data);
        if (!result) {
            return Response.json(
                { error: `Couldn't find a location matching "${parsed.data.location}"` },
                { status: 404 },
            );
        }
        return Response.json(result);
    } catch (error) {
        if (error instanceof PlacesApiError) {
            return Response.json({ error: error.message }, { status: error.status });
        }
        throw error;
    }
}
