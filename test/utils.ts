export const extractCookieValue = (
    cookieHeader: string | string[],
    name: string,
) => {
    const cookieStringFull = Array.isArray(cookieHeader)
        ? cookieHeader.find((header) => header.includes(name))
        : cookieHeader;
    return name + cookieStringFull?.split(name)[1].split(";")[0];
};
