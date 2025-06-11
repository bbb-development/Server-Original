import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const loadConfig = () => {
  const imapUser = process.env.IMAP_USER;
  const imapPass = process.env.IMAP_PASS;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!imapPass || !imapUser ||
    !supabaseUrl ||
    !supabaseServiceRoleKey
  ) {
    throw new Error("Environment variables not found.");
  }

  const config = {
    imapUser,
    imapPass,
    supabaseUrl,
    supabaseServiceRoleKey,
  };

  return config;
};

const envConfig = loadConfig();

export default envConfig; 