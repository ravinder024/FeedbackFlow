import { Box, Card, CardContent, Typography, Button, Stack } from '@mui/material';
import Link from 'next/link';
import { UserTestGroup } from '@prisma/client';

interface TestGroupListProps {
  testGroups: (UserTestGroup & {
    _count: {
      members: number;
    };
  })[];
}

export default function TestGroupList({ testGroups }: TestGroupListProps) {
  if (!testGroups.length) {
    return (
      <Typography variant="body1" color="text.secondary" align="center">
        No test groups found. Create one to get started!
      </Typography>
    );
  }

  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
      gap: 3 
    }}>
      {testGroups.map((group) => (
        <Card key={group.id}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6" component="h2">
                {group.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {group.description}
              </Typography>
              <Typography variant="body2">
                Members: {group._count.members}
              </Typography>
              <Link href={`/test-groups/${group.id}`} passHref>
                <Button variant="contained" color="primary">
                  View Details
                </Button>
              </Link>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
} 