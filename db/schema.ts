import { pgTable, text, timestamp, integer, boolean, uuid } from 'drizzle-orm/pg-core';

// Tabela de Perfis (Sincronizada com o Supabase Auth)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // Mesmo ID do auth.users do Supabase
  email: text('email').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  
  plan: text('plan').notNull().default('free'), // 'free' ou 'premium'
  dailyGoalMinutes: integer('daily_goal_minutes').notNull().default(240),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela de Sessões de Estudo
export const studySessions = pgTable('study_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  
  subject: text('subject').notNull(),
  topic: text('topic'), // Opcional (Fase VIP: ex. "Direitos Fundamentais")
  
  mode: text('mode').notNull(), // 'temporizador' ou 'cronometro'
  netSeconds: integer('net_seconds').notNull(),
  grossSeconds: integer('gross_seconds').notNull(),
  
  // Timestamps
  startedAt: timestamp('started_at').notNull(),
  finishedAt: timestamp('finished_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabela de Streak Diário 
export const dailyGoalsLog = pgTable('daily_goals_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  
  dateKey: text('date_key').notNull(), // Formato "YYYY-MM-DD"
  totalNetSeconds: integer('total_net_seconds').notNull().default(0),
  goalMet: boolean('goal_met').notNull().default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
