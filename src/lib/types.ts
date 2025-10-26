export type AppUser = { id: string; auth_id: string; email: string; name: string; role: 'admin'|'user' }
export type Pool = { id: string; name: string; season_id?: string | null; created_at?: string }
export type Week = { weekNumber: number }
export type Team = { id: string; name: string; short_name: string }
export type Game = { id: string; kickoff_at: string; status: string; tieFlag?: boolean; weekNumber: number; home: Team; away: Team }
export type Pick = { pool_id: string; user_id: string; game_id: string; prediction: 'H'|'A'|'T' }
