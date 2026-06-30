# SMB Cybersecurity Risk Assessment Tool

A full-stack assessment tool for evaluating small and mid-size business cybersecurity posture across 9 security domains, with AI-powered report generation and professional PDF export.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS (deploy to Netlify)
- **Backend**: Python FastAPI (deploy to Railway or Render)
- **AI**: Claude claude-sonnet-4-6 for report generation
- **PDF**: ReportLab for production-quality PDF export

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
ANTHROPIC_API_KEY=your-api-key-here
```

Run:
```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

The frontend `.env` defaults to `VITE_API_URL=http://localhost:8000`.

## Deployment

### Frontend (Netlify)

1. Connect your repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `frontend/dist`
4. Set base directory: `frontend`
5. Add environment variable: `VITE_API_URL=https://your-backend-url.railway.app`

### Backend (Railway)

1. Connect your repo to Railway
2. Set root directory: `backend`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variable: `ANTHROPIC_API_KEY`
5. Update CORS origins in `main.py` with your Netlify production URL

## Security Domains

1. Asset Management (CIS Controls v8)
2. Access Control & IAM (NIST CSF + ISO 27001)
3. Vulnerability Management (CIS Controls v8)
4. Data Protection & Backup (ISO 27001)
5. Incident Response (NIST CSF)
6. Vendor & Third-Party Risk (NIST CSF)
7. Compliance & Regulatory
8. Physical Security (ISO 27001)
9. Security Awareness & Training (CIS Controls v8)
