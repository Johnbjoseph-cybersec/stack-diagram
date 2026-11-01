export async function deleteStackFiles(bucket: R2Bucket, id: string) {
  const listed = await bucket.list({ prefix: `stacks/${id}/` });
  await bucket.delete([...listed.objects.map((object) => object.key), `og/${id}.png`]);
}
