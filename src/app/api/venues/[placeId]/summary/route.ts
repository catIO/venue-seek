import { getPlaceSummary, PlacesApiError } from "@/lib/places/client";
import { placeIdSchema } from "@/lib/venues/searchSchema";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ placeId: string }> },
) {
    const parsed = placeIdSchema.safeParse((await params).placeId);
    if (!parsed.success) {
        return Response.json({ error: "Invalid place id" }, { status: 400 });
    }

    try {
        return Response.json(await getPlaceSummary(parsed.data));
    } catch (error) {
        if (error instanceof PlacesApiError) {
            return Response.json({ error: error.message }, { status: error.status });
        }
        throw error;
    }
}
