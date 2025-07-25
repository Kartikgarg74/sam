# Free-Tier Resource Allocation Plan for Samantha AI Assistant

This plan outlines how Samantha AI Assistant will maximize the use of free-tier services to minimize infrastructure costs, aligning with the project's budget constraints.

## 1. AI Services

-   **Google Gemini 2.5 Flash API (Primary AI)**:
    -   **Free Tier**: Google Cloud generally offers a free tier for many of its services, including AI APIs. Specific limits for Gemini 2.5 Flash will be monitored and adhered to. Typically, this includes a certain number of requests or tokens per month.
    -   **Allocation Strategy**: 
        -   Prioritize Gemini for complex natural language understanding and command interpretation.
        -   Implement aggressive caching for common queries or static responses to reduce API calls.
        -   Optimize prompts to minimize token usage per request.
        -   Monitor usage closely to stay within free limits. If limits are approached, consider implementing a fallback to simpler, local rule-based processing for very basic commands, or prompt the user about potential costs.

-   **OpenAI Whisper Tiny (Local Speech-to-Text)**:
    -   **Free Tier**: This model runs entirely locally on the user's Mac M2. Therefore, it incurs no direct cloud-based API costs.
    -   **Allocation Strategy**: 
        -   Leverage the user's local hardware (Mac M2 Neural Engine) for all STT processing.
        -   Ensure the `tiny` model is used to minimize local resource consumption (CPU, RAM) and maintain performance on constrained hardware.

-   **ElevenLabs (Text-to-Speech)**:
    -   **Free Tier**: 20,000 characters per month.
    -   **Allocation Strategy**: 
        -   Use ElevenLabs for all TTS output due to its high quality.
        -   Keep spoken responses concise and to the point to conserve characters.
        -   Avoid unnecessary verbal confirmations or verbose responses.
        -   Monitor character usage. If the free tier is consistently exceeded, explore options like:
            -   Implementing a local, lower-quality TTS fallback for less critical responses.
            -   Offering an option for users to provide their own ElevenLabs API key for higher usage.

## 2. Hosting & Infrastructure

-   **Backend (FastAPI)**:
    -   **Free Tier Options**: Railway.app (as mentioned in original `README.md`), Render, or Fly.io often provide free tiers for small web services.
    -   **Allocation Strategy**: 
        -   Deploy the FastAPI backend to a platform with a generous free tier (e.g., Railway's free hobby plan, if available and suitable for the scale).
        -   Optimize the backend for low memory and CPU usage to fit within free-tier resource limits (e.g., 512MB RAM, shared CPU).
        -   Implement efficient startup and shutdown procedures to minimize active time if the service scales to demand-based billing.

-   **Frontend (Next.js Web Management Interface)**:
    -   **Free Tier Options**: Vercel (as mentioned in original `README.md`), Netlify, or GitHub Pages.
    -   **Allocation Strategy**: 
        -   Host the Next.js application on Vercel's free tier, which offers generous build minutes, bandwidth, and serverless function execution.
        -   Utilize Next.js's static site generation (SSG) capabilities for parts of the management interface that don't require real-time data, further reducing serverless function usage.

-   **Database (Optional/Future)**:
    -   **Free Tier Options**: Supabase, PlanetScale (for MySQL), Neon (for PostgreSQL), or SQLite (local).
    -   **Allocation Strategy**: 
        -   For initial development and minimal data storage, consider using SQLite locally within the desktop application or a simple file-based storage.
        -   If a shared database is required (e.g., for user preferences synced across devices), explore free-tier PostgreSQL or MySQL offerings from providers like Supabase or Neon, ensuring usage stays within row/storage/compute limits.

## 3. Development & Deployment Tools

-   **Version Control**: GitHub (free private repositories).
-   **CI/CD**: GitHub Actions (free minutes per month).
-   **Containerization (Optional)**: Docker Desktop (local development, no direct cost).

## 4. Monitoring & Logging

-   **Free Tier Options**: Basic logging provided by hosting platforms, or integrate with free tiers of services like Sentry (for error tracking) or Logtail (for log management).
-   **Allocation Strategy**: 
    -   Keep logging verbose during development but reduce verbosity in production to minimize log volume and associated costs.
    -   Focus on critical errors and performance metrics.

## Overall Strategy

-   **Local-First Approach**: Prioritize local processing (Whisper Tiny, macOS automation) to offload cloud resources and enhance privacy.
-   **Usage Monitoring**: Implement robust monitoring for all cloud services to track consumption against free-tier limits.
-   **Cost-Aware Design**: Continuously evaluate design choices for their potential impact on infrastructure costs.
-   **Scalability with Cost in Mind**: Design the architecture to allow for graceful scaling to paid tiers only when necessary and with clear cost implications understood.

This plan ensures that Samantha AI Assistant can be developed, deployed, and maintained with minimal to no infrastructure costs during its initial phases and for users with light usage patterns.