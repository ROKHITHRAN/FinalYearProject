import api from "../lib/api";

export const getQueryResult = async (query: string) => {
  try {
    const response = api.post("/query", { query: query });
    return response;
  } catch (err) {
    console.log(err);
  }
};
