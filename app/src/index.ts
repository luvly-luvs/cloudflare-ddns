import "dotenv/config";
import axios, { AxiosError } from "axios";

async function getIp(): Promise<string | Error> {
  try {
    const { data } = await axios.get("https://api.ipify.org?format=json");
    return data.ip;
  } catch (e: any) {
    return new Error(e?.message || e);
  }
}

async function run() {
  try {
    const token = process.env?.CLOUDFLARE_TOKEN || new Error("no token");
    const zoneId = process.env?.ZONE_ID || new Error("no zone id");
    const domains = process.env?.DOMAINS?.split(",") || new Error("no domains");
    const ip = await getIp();

    [token, zoneId, domains, ip].forEach((v) => {
      if (v instanceof Error) {
        throw v;
      }
    });

    const client = axios.create({
      baseURL: "https://api.cloudflare.com/client/v4/",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const { data } = await client.get(`/zones/${zoneId}/dns_records`, {
      params: {
        type: "A",
      },
    });

    const { result } = data;

    if (!result.length) {
      throw new Error("no dns records");
    }

    const domainRegex = new RegExp(`^(${(domains as string[]).join("|")})$`);
    const records: { id: string; name: string }[] = result
      .filter((r: any) => domainRegex.test(r.name))
      .map((r: any) => ({ id: r.id, name: r.name }));

    records.forEach((record: any) =>
      console.log(`Updating record:     ${record.name}  ->  ${ip as string}`)
    );

    await Promise.all(
      records.map(({ id, name }) =>
        client.put(`/zones/${zoneId}/dns_records/${id}`, {
          type: "A",
          name,
          content: ip as string,
          ttl: 1,
          proxied: true,
        })
      )
    );
  } catch (e: any) {
    console.error(
      (e as AxiosError).response?.data,
      JSON.parse((e as AxiosError).config?.data)
    );
  }
}

run();
