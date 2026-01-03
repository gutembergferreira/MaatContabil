export const getCompetenceKey = (date = new Date()) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}`;
};

export const parseDueDay = (value) => {
    if (!value) return null;
    const match = String(value).match(/\d+/);
    if (!match) return null;
    const day = Number(match[0]);
    if (Number.isNaN(day) || day < 1 || day > 31) return null;
    return day;
};
