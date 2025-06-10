export const config: {
    server: {
        port: number | string;
        nodeEnv: string;
    };
    db: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
    };
    jwt: {
        secret: string;
        expiresIn: string | number;
    };
} = {
    server: {
        port: process.env.PORT || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'quickclock_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'kasim@123',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default_secret_key',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
};
