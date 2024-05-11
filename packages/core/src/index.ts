export const name = 'core';

/* design
const schema = z.object({
  name: z.string(),
  range: z.tuple([z.number(), z.number()]),
  tags: z.array(z.string()),
  description: z.string().optional(),
  metadata: z.object({
    adId: z.string(),
    adType: z.enum(['video', 'banner']),
  })
});
type TestType = {
  name: string;
  range: [number, number];
  tags: string[];
  description?: string;
  metadata: {
    adId: string;
    adType: 'video' | 'banner';
  };
};
const config = new Config<TestType>({
  validator: ZodValidator(schema),
  persister: FilePersister(),
});

*/
