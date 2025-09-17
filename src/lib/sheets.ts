import { google } from 'googleapis';
import { prisma } from './prisma';

interface SheetConfig {
  spreadsheetId: string;
  range: string;
  credentials: {
    client_email: string;
    private_key: string;
    project_id: string;
  };
}

export async function initializeGoogleSheets(config: SheetConfig) {
  const auth = new google.auth.JWT({
    email: config.credentials.client_email,
    key: config.credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function exportFeedbackToSheet(testGroupId: string) {
  try {
    // Get sheet integration settings
    const integration = await prisma.sheetIntegration.findUnique({
      where: { testGroupId },
      select: { spreadsheetId: true, settings: true },
    });

    if (!integration) {
      throw new Error('No sheet integration found for this test group');
    }

    // Get feedback data
    const feedback = await prisma.testFeedback.findMany({
      where: {
        session: {
          testGroupId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        session: {
          select: {
            startTime: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Initialize Google Sheets
    const sheets = await initializeGoogleSheets({
      spreadsheetId: integration.spreadsheetId,
      range: 'A1',
      credentials: JSON.parse(integration.settings as string).credentials,
    });

    // Prepare data for export
    const headers = [
      'Feedback ID',
      'User',
      'Email',
      'Content',
      'Category',
      'Rating',
      'Quality Score',
      'Session Status',
      'Session Start',
      'Created At',
    ];

    const rows = feedback.map((item) => [
      item.id,
      item.user.name || 'Anonymous',
      item.user.email || 'N/A',
      item.content,
      item.category || 'N/A',
      item.rating?.toString() || 'N/A',
      item.qualityScore?.toString() || 'N/A',
      item.session.status,
      new Date(item.session.startTime).toISOString(),
      new Date(item.createdAt).toISOString(),
    ]);

    // Update sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: integration.spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers, ...rows],
      },
    });

    // Update last sync timestamp
    await prisma.sheetIntegration.update({
      where: { testGroupId },
      data: { lastSync: new Date() },
    });

    return true;
  } catch (error) {
    console.error('Error exporting feedback to sheet:', error);
    throw error;
  }
}

export async function setupSheetIntegration(
  testGroupId: string,
  sheetId: string,
  credentials: {
    client_email: string;
    private_key: string;
    project_id: string;
  }
) {
  try {
    // Validate credentials by attempting to initialize
    const sheets = await initializeGoogleSheets({
      spreadsheetId: sheetId,
      range: 'A1',
      credentials,
    });

    // Test access to the sheet
    await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    // Create or update integration
    await prisma.sheetIntegration.upsert({
      where: { testGroupId },
      create: {
        testGroupId,
        sheetId,
        name: 'Feedback Export',
        settings: {
          credentials,
          autoSync: true,
          syncInterval: 'daily',
        },
      },
      update: {
        sheetId,
        settings: {
          credentials,
          autoSync: true,
          syncInterval: 'daily',
        },
      },
    });

    return true;
  } catch (error) {
    console.error('Error setting up sheet integration:', error);
    throw error;
  }
} 