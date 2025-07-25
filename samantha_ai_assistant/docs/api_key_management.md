# Samantha AI API Key Management & Usage Tracking

## Overview
This guide describes secure handling of API keys and usage tracking for Gemini, ElevenLabs, and other sensitive integrations in the Samantha AI monorepo.

---

## 1. Storing API Keys
- **Never commit API keys or secrets to git**
- Store all secrets in `.env` files (local/dev) or secret managers (prod)
- Example `.env` entries:
  ```env
  GEMINI_API_KEY=your-gemini-key
  ELEVENLABS_API_KEY=your-elevenlabs-key
  ```
- Add `.env` and similar files to `.gitignore`

## 2. Loading API Keys
- **TypeScript/Node.js:** Use [dotenv](https://www.npmjs.com/package/dotenv)
  ```typescript
  import 'dotenv/config';
  const geminiKey = process.env.GEMINI_API_KEY;
  ```
- **Python:** Use [python-dotenv](https://pypi.org/project/python-dotenv/)
  ```python
  from dotenv import load_dotenv
  import os
  load_dotenv()
  gemini_key = os.getenv('GEMINI_API_KEY')
  ```

## 3. Production Secrets
- Use platform secret managers (e.g., Railway, Vercel, AWS Secrets Manager)
- Never print secrets in logs or error messages
- Rotate keys regularly and after any suspected leak

## 4. Usage Tracking
- Track API usage to avoid exceeding free-tier limits
- Log each request and response status
- For ElevenLabs, track monthly character usage
- For Gemini, monitor request counts and errors

### Example Usage Logging (TypeScript)
```typescript
logger.info('Gemini API request', { endpoint, user, timestamp });
```

### Example Usage Logging (Python)
```python
logger.info(f"ElevenLabs API request: endpoint={endpoint}, user={user}")
```

## 5. Best Practices
- Use environment variables for all secrets
- Never hardcode keys in code or config
- Review `.gitignore` regularly
- Audit codebase for accidental leaks
- Use different keys for dev, staging, and prod

---

## References
- [dotenv (Node.js)](https://www.npmjs.com/package/dotenv)
- [python-dotenv](https://pypi.org/project/python-dotenv/)
- [Railway Secrets](https://docs.railway.app/develop/variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

_Last updated: 2025_
