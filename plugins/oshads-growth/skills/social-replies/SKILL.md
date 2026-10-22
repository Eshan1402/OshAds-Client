---
name: social-replies
description: Draft brand-voice replies to open comments on an OshAds client's social posts, escalating sensitive ones to a person. Use when asked to answer comments, DMs or community questions.
---

# Social replies

1. `list_open_comments` for the client; `get_client_brief` for facts.
2. For each comment either:
   - `draft_comment_reply` — short, warm, specific, only facts from the brief; or
   - `escalate_comment` — bugs/crashes, security or privacy, billing/refunds, legal, harassment, anger.
3. Report a table: comment → drafted / escalated (and why).

Replies are drafts until a person approves them.
