export const utcNow = () => new Date();

export const utcPlusMs = (base: Date, deltaMs: number) => new Date(base.getTime() + deltaMs);
