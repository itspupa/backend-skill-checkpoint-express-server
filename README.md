# Q&A Express API

An Express + PostgreSQL API for managing questions and answers with voting and search.

## Setup

1. Requirements: Node.js 18+, PostgreSQL 13+
2. Create a Postgres database, e.g. `express_server`.
3. Configure environment:
   - Create a `.env` file in the project root with:
     - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/express_server`
4. Install dependencies:
   - `npm install`
5. Start server:
   - `npm run start`

On first start, tables `questions`, `answers`, `question_votes`, and `answer_votes` will be created automatically.

## Endpoints

- POST `/questions`
  - Body: `{ "title": string, "description": string, "category": string }`
  - 201: `{ "message": "Question created successfully." }`
  - 400 / 500 per spec

- GET `/questions`
  - 200: `{ "data": Question[] }`

- GET `/questions/:questionId`
  - 200: `{ "data": Question }`, 404 if not found

- PUT `/questions/:questionId`
  - Body (any of): `{ "title"?: string, "description"?: string, "category"?: string }`
  - 200: `{ "message": "Question updated successfully." }`

- DELETE `/questions/:questionId`
  - 200: `{ "message": "Question post has been deleted successfully." }`

- GET `/questions/search?title=...&category=...`
  - 200: `{ "data": Question[] }`

- POST `/questions/:questionId/answers`
  - Body: `{ "content": string (<=300 chars) }`
  - 201: `{ "message": "Answer created successfully." }`

- GET `/questions/:questionId/answers`
  - 200: `{ "data": Answer[] }`

- DELETE `/questions/:questionId/answers`
  - 200: `{ "message": "All answers for the question have been deleted successfully." }`

- POST `/questions/:questionId/vote`
  - Body: `{ "vote": 1 | -1 }`
  - 200: `{ "message": "Vote on the question has been recorded successfully." }`

- POST `/answers/:answerId/vote`
  - Body: `{ "vote": 1 | -1 }`
  - 200: `{ "message": "Vote on the answer has been recorded successfully." }`

## Data Models

- Question: `{ id, title, description, category, votes, created_at }` (votes is aggregated)
- Answer: `{ id, question_id, content, votes, created_at }` (votes is aggregated)

## Notes

- Deleting a question cascades and deletes its answers.
- Input validation returns 400 for invalid data; 404 for non-existent resources; 500 for server/database errors.

## Thai Requirements (สรุป)

- ผู้ใช้สร้างคำถาม (หัวข้อ/คำอธิบาย/หมวดหมู่), ดูทั้งหมด, ดูตาม ID, แก้ไข, ลบ, ค้นหาตามหัวข้อหรือหมวดหมู่ได้
- ผู้ใช้สร้างคำตอบ (ไม่เกิน 300 ตัวอักษร), ดูคำตอบของคำถาม, ลบคำตอบทั้งหมดของคำถามได้
- ลบคำถามจะลบคำตอบทั้งหมดที่เกี่ยวข้อง
