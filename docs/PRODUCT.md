# Product Vision

Gym Workout Tracker is a mobile-first Angular PWA that provides a personal trainer-like workout experience combined with detailed workout tracking.

## Long-term Goal

Open the app → see today's scheduled workout → follow exercise sequence with targets and previous performance → record sets → manage rest → complete workout → track progress, streaks, milestones, and personal records → eventually receive AI-powered personalized recommendations.

## Problem

Workout plans from ChatGPT or other sources are not optimized for repeated use during a gym session. Users must remember exercises, sequence, sets, reps, weights, rest periods, and completion status. This app eliminates that cognitive overhead.

## Core Workflow

```
PLAN → TRAIN → TRACK → REST → REPEAT → COMPLETE → REVIEW
```

## Target User

A person who regularly goes to the gym and wants structured, trainer-like workouts without a personal trainer. Initially optimized for a single user.

## MVP Scope

### Workout Setup
- Create workout programs, weekly splits, assign workouts to days
- Create/edit workouts: exercises, sets, reps, weight, rest, notes
- Reorder and remove exercises

### Exercise Library
- Built-in exercises, search, filter by muscle group and equipment
- Custom exercises

### Workout Execution
- Today's workout, start workout, follow sequence
- Target sets/reps, previous performance, actual weight/reps
- Complete/skip sets and exercises, rest timer
- Pause/resume/abandon workout

### Workout Completion
- Summary: duration, completed sets, volume, PRs, XP, streak

### History & Progress
- Completed workouts, exercise history, performance progression
- Workout count, streaks, volume, personal records

## Out of MVP Scope

Friends, social feed, leaderboards, messaging, trainer marketplace, AI generation/coaching, nutrition, wearables, subscriptions, complex cloud sync, multi-user admin.

## Core Principle

> "I don't need to remember my workout anymore. I open the app and it tells me exactly what to do."

The app is first and foremost a **fast, reliable, mobile workout execution and tracking application**.

## Critical Domain Rule

**Workout** (reusable plan) and **WorkoutSession** (historical execution) are never the same thing. Changing a plan must not alter historical session data.
