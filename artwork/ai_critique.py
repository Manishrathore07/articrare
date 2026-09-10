"""
Articrare — AI Vision Critique Service (Milestone 5)

Sends uploaded sketch images to Google Gemini Vision API and returns
structured art critique: score, strengths, and actionable suggestions.

Usage:
    from artwork.ai_critique import get_ai_critique
    result = get_ai_critique(image_path, title, category, focus, notes)
"""

import json
import re
from pathlib import Path
from django.conf import settings


def get_ai_critique(image_path: str, title: str, category: str, focus: str, notes: str) -> dict:
    """
    Analyzes a sketch image using Gemini Vision and returns structured critique.

    Returns a dict with keys:
        score (float): 0.0 - 10.0
        strengths (str): What works well
        suggestions (str): Specific, actionable improvement
        ai_powered (bool): True on success, False on fallback
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '')

    if not api_key or api_key == 'YOUR_GEMINI_API_KEY_HERE':
        return _fallback_critique(focus)

    try:
        import google.generativeai as genai
        from PIL import Image as PILImage

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        # Load the image for Gemini
        img = PILImage.open(image_path)

        prompt = f"""You are an expert art instructor reviewing a student sketch for the Articrare platform.

Sketch Details:
- Title: "{title}"
- Medium / Style: {category}
- Artist's Focus Area: {focus}
- Artist's Notes: "{notes if notes else 'No notes provided.'}"

Please analyze this sketch image carefully and respond with ONLY a JSON object in this exact format:
{{
  "score": <number between 1.0 and 10.0 with one decimal>,
  "strengths": "<one or two specific sentences about what is working well in this sketch>",
  "suggestions": "<one or two specific, actionable improvement suggestions tailored to the focus area>"
}}

Be encouraging but honest. Focus your feedback on the artist's stated focus area ({focus}).
Respond ONLY with the JSON. No extra text."""

        response = model.generate_content([prompt, img])
        raw = response.text.strip()

        # Strip markdown code fences if present
        raw = re.sub(r'^```(?:json)?\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)

        data = json.loads(raw)

        score = float(data.get('score', 8.0))
        score = max(1.0, min(10.0, score))

        return {
            'score': round(score, 1),
            'strengths': str(data.get('strengths', '')).strip(),
            'suggestions': str(data.get('suggestions', '')).strip(),
            'ai_powered': True,
        }

    except ImportError:
        # google-generativeai not installed
        return _fallback_critique(focus)
    except Exception as e:
        print(f"[Articrare AI] Gemini critique failed: {e}")
        return _fallback_critique(focus)


def _fallback_critique(focus: str) -> dict:
    """Returns a pre-written critique when Gemini is unavailable."""
    critiques = {
        'Anatomy & Proportions': {
            'score': 8.6,
            'strengths': 'Solid posture grounding and head-to-shoulder ratio.',
            'suggestions': 'Double check forearm taper; slightly soften the joint transition.',
        },
        'Shading & Contrast': {
            'score': 8.2,
            'strengths': 'Clear direction of primary light source across planes.',
            'suggestions': 'Push the cast shadows darker with a 4B/6B pencil to increase drama.',
        },
        'Linework & Cleanliness': {
            'score': 8.9,
            'strengths': 'Confident, unhesitating strokes and distinct silhouette contour.',
            'suggestions': 'Vary line weight — thicker on underside shadows, thinner in highlight areas.',
        },
        'Perspective & Depth': {
            'score': 8.3,
            'strengths': 'Effective foreshortening in the foreground elements.',
            'suggestions': 'Drop background detail to enhance atmospheric depth.',
        },
        'General Feedback': {
            'score': 8.5,
            'strengths': 'Evocative expression, expressive gesture, and strong personal style.',
            'suggestions': 'Keep practicing this angle—push the values further for maximum pop!',
        },
    }
    c = critiques.get(focus, critiques['General Feedback'])
    return {
        'score': c['score'],
        'strengths': c['strengths'],
        'suggestions': c['suggestions'],
        'ai_powered': False,
    }
