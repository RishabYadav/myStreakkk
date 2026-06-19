# AI Shareable Content Engine

## Goal

Build a personalized content generation engine similar to Turtlemint.

Input:

* Partner Code

Output:

* Headline
* Caption
* CTA
* Hashtags
* Image Prompt
* Poster Image

---

# Current Architecture (V1)

Initially, keep the system simple.

Use a single agent.

```text
Partner Code
      ↓
Get Partner Details Tool
      ↓
Context Builder
      ↓
Prompt Template
      ↓
LLM
      ↓
Structured JSON Output
```

---

## Flow

### Step 1

Receive partner code.

Example:

```json
{
  "partnerCode":"PB12345"
}
```

---

### Step 2

Fetch partner data from database.

Example:

```json
{
  "partner_name":"Abhishek Mehto",
  "city":"Delhi",
  "top_product":"Health Insurance",
  "monthly_booking":20
}
```

---

### Step 3

Build Context

Example:

```text
Partner Name: Abhishek Mehto
City: Delhi
Top Product: Health Insurance
Monthly Booking: 20
```

---

### Step 4

Apply Prompt Components

### System Prompt

Role:

Insurance marketing expert

Rules:

* Use simple English
* Avoid false claims
* Return JSON only

---

### Few Shot Examples

Provide examples for:

* Health Insurance
* Motor Insurance

---

### User Prompt

Contains:

* Partner information
* Product
* Audience
* Context

---

### Step 5

Call LLM

Example:

Gemini 2.5 Flash

---

### Step 6

Return structured JSON

```json
{
  "headline":"",
  "caption":"",
  "cta":"",
  "hashtags":[],
  "image_prompt":""
}
```

---

# Current Single-Agent Flow

```text
Partner Code
      ↓
DB Tool
      ↓
Context Builder
      ↓
System Prompt
      ↓
Few Shot Examples
      ↓
User Prompt
      ↓
Gemini/OpenAI
      ↓
JSON Output
```

---

# Future Architecture (Multi-Agent)

When the system grows, split responsibilities into specialized agents.

```text
Partner Code
      ↓
Orchestrator Agent
      ↓
------------------------------------------------
↓                 ↓                 ↓
Theme Agent    Content Agent    Image Agent
------------------------------------------------
                      ↓
              Validator Agent
                      ↓
               Nano Banana API
                      ↓
                Final Poster
```

---

# Theme Agent

Role:

Marketing Strategist

Input:

Partner data

Output:

```json
{
    "theme":"Family Protection"
}
```

Responsibilities:

* Understand partner behavior
* Determine campaign type
* Determine audience

---

# Content Agent

Role:

Professional Copywriter

Input:

Theme

Output:

```json
{
    "headline":"",
    "caption":"",
    "cta":"",
    "hashtags":[]
}
```

Responsibilities:

* Generate social content
* Generate CTA
* Generate hashtags

---

# Image Agent

Role:

AI Image Prompt Engineer

Input:

Content

Output:

```json
{
    "image_prompt":"..."
}
```

Responsibilities:

* Generate Nano Banana prompt
* Define style
* Define colors
* Define layout

---

# Validator Agent

Role:

Brand Compliance Expert

Checks:

* Grammar
* Character limits
* Marketing quality
* False claims
* JSON correctness

Output:

```json
{
    "approved": true
}
```

---

# Orchestrator Agent

Responsibilities:

* Decide which agent to call
* Pass context between agents
* Handle retries
* Collect outputs
* Produce final response

---

# Future Flow

```text
Partner Code
      ↓
Get Partner Details Tool
      ↓
Orchestrator Agent
      ↓
Theme Agent
      ↓
Content Agent
      ↓
Image Prompt Agent
      ↓
Validator Agent
      ↓
Gemini Nano Banana
      ↓
Final Poster
```

---

# Prompt Engineering Concepts Used

## Current Version

* System Prompt
* Zero Shot Prompting
* Chain of Thought
* Structured JSON Output
* Prompt Templates
* Few Shot Prompting
* Role Prompting
* Context Management
* Tool Calling

---

## Future Version

* Multi-Agent Systems
* Orchestrator Pattern
* Reflection Pattern
* Self-Correction
* LangGraph
* RAG
* Tool Calling
* Agentic Workflows
* Image Prompt Engineering

---

# Recommendation

Start with:

```text
Partner Code
      ↓
DB Tool
      ↓
Single Agent
      ↓
JSON Output
```

Do not build multi-agent architecture initially.

Once V1 works and content quality is stable, gradually move to specialized agents.
