import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const SPACES_REGION = process.env.SPACES_REGION || '';
const SPACES_BUCKET = process.env.SPACES_BUCKET || '';
const SPACES_KEY = process.env.SPACES_KEY || '';
const SPACES_SECRET = process.env.SPACES_SECRET || '';

const isConfigured = () => SPACES_REGION && SPACES_BUCKET && SPACES_KEY && SPACES_SECRET;

const s3 = isConfigured()
    ? new S3Client({
          region: 'us-east-1',
          endpoint: `https://${SPACES_REGION}.digitaloceanspaces.com`,
          credentials: {
              accessKeyId: SPACES_KEY,
              secretAccessKey: SPACES_SECRET
          }
      })
    : null;

export const createUploadUrl = async ({ key, contentType }) => {
    if (!s3) {
        throw new Error('Spaces not configured');
    }
    const command = new PutObjectCommand({
        Bucket: SPACES_BUCKET,
        Key: key,
        ContentType: contentType,
        ACL: 'private'
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    return {
        url,
        bucket: SPACES_BUCKET,
        region: SPACES_REGION,
        key
    };
};
