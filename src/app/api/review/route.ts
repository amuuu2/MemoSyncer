import { createClient } from "@supabase/supabase-js";
import { calculateSM2, DEFAULT_SM2 } from "@/lib/sm2";

export async function POST(req: Request) {
  try {
    const { card_id, quality } = await req.json();

    if (!card_id || quality === undefined) {
      return Response.json(
        { error: "card_id and quality are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing review state or create new
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("*")
      .eq("card_id", card_id)
      .eq("user_id", user.id)
      .single();

    const prevState = existingReview
      ? {
          easiness_factor: existingReview.easiness_factor as number,
          interval: existingReview.interval as number,
          repetitions: existingReview.repetitions as number,
        }
      : DEFAULT_SM2;

    const result = calculateSM2({ quality, ...prevState });

    if (existingReview) {
      await supabase
        .from("reviews")
        .update({
          easiness_factor: result.easiness_factor,
          interval: result.interval,
          repetitions: result.repetitions,
          next_review: result.next_review.toISOString().split("T")[0],
          last_review: new Date().toISOString(),
        })
        .eq("id", existingReview.id);
    } else {
      await supabase.from("reviews").insert({
        card_id,
        user_id: user.id,
        easiness_factor: result.easiness_factor,
        interval: result.interval,
        repetitions: result.repetitions,
        next_review: result.next_review.toISOString().split("T")[0],
        last_review: new Date().toISOString(),
      });
    }

    return Response.json({
      next_review: result.next_review.toISOString().split("T")[0],
      interval: result.interval,
    });
  } catch (error) {
    console.error("Review error:", error);
    return Response.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}
