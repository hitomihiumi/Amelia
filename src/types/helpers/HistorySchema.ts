export interface HistorySchema {
    guild_id: string;
    guild: {
        transactions: Transaction[];
        warns: Warn[];
        reports: Report[];
    };
}

export interface Transaction {
    id: number;
    amount: number;
    type: string;
    date: number;
    from: string;
    to: string;
}

export interface Warn {
    id: string;
    reason: string;
    time: number;
    moderator: string;
}

export interface Report {
    id: string;
    reported: string;
    reporter: string;
    moderator: string | null;
    evidence: string;
    reason: string;
    date: Date;
    status: string;
    mod_response: string;
}
