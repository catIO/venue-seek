import { autocompleteLocations, PlacesApiError } from "@/lib/places/client";
import { autocompleteQuerySchema } from "@/lib/venues/searchSchema";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsed = autocompleteQuerySchema.safeParse({
        input: searchParams.get("input") ?? "",
        sessionToken: searchParams.get("sessionToken") ?? undefined,
    });
    if (!parsed.success) {
        return Response.json({ error: "Invalid autocomplete request" }, { status: 400 });
    }

    try {
        const suggestions = await autocompleteLocations(parsed.data.input, parsed.data.sessionToken);
        return Response.json({ suggestions });
    } catch (error) {
        if (error instanceof PlacesApiError) {
            return Response.json({ error: error.message }, { status: error.status });
        }
        throw error;
    }
}
