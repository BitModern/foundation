export function downloadFile(content: string | Blob, filename: string, contentType?: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: contentType || 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

export function formatTestCasesAsMarkdown(testCases: any[], stepsAsTable: boolean = false): string {
  if (!testCases || testCases.length === 0) {
    return "# No Test Cases Generated\n\nPlease generate test cases first.";
  }

  let markdown = "# Generated Test Cases\n\n";
  
  testCases.forEach((testCase, index) => {
    if (!testCase) return;
    
    markdown += `## ${testCase.test_name || `Test Case ${index + 1}`}\n\n`;
    markdown += `**Type:** ${testCase.test_type || "Functionality"}\n`;
    markdown += `**Priority:** ${testCase.test_priority || "Medium"}\n`;
    
    if (testCase.folder_name) {
      markdown += `**Folder:** ${testCase.folder_name}\n`;
    }
    
    if (testCase.assignee) {
      markdown += `**Assignee:** ${testCase.assignee}\n`;
    }
    
    if (testCase.test_precondition) {
      markdown += `**Precondition:** ${testCase.test_precondition}\n\n`;
    } else {
      markdown += `\n`;
    }
    
    if (testCase.steps && Array.isArray(testCase.steps) && testCase.steps.length > 0) {
      markdown += "### Steps:\n\n";
      
      if (stepsAsTable) {
        // Format as table with step numbers
        markdown += "| Step # | Step | Expected Result |\n";
        markdown += "|--------|------|----------------|\n";
        testCase.steps.forEach((step: any, stepIndex: number) => {
          if (step && step.step_description) {
            const stepDesc = step.step_description.replace(/\|/g, '\\|'); // Escape pipes
            const expectedResult = (step.step_expected_result || '').replace(/\|/g, '\\|'); // Escape pipes
            markdown += `| ${stepIndex + 1} | ${stepDesc} | ${expectedResult} |\n`;
          }
        });
        markdown += "\n";
      } else {
        // Format as numbered list
        testCase.steps.forEach((step: any, stepIndex: number) => {
          if (step && step.step_description) {
            markdown += `${stepIndex + 1}. **${step.step_description}**\n`;
            if (step.step_expected_result) {
              markdown += `   - *Expected Result:* ${step.step_expected_result}\n\n`;
            }
          }
        });
      }
    }
    
    markdown += "---\n\n";
  });

  return markdown;
}

export function formatTestCasesAsCSV(testCases: any[]): string {
  const headers = [
    "folder_key",
    "folder_name", 
    "test_key",
    "test_name",
    "test_type",
    "test_priority",
    "test_precondition",
    "test_assigned_to",
    "test_is_automated",
    "test_estimate",
    "test_attachments",
    "test_requirements",
    "test_labels",
    "step_description",
    "step_expected_result",
    "step_sequence",
    "data_set"
  ];

  let csv = headers.join(",") + "\n";
  
  testCases.forEach((testCase, testIndex) => {
    const folderKey = testIndex + 1;
    const testKey = (testIndex + 1) * 1000;
    
    testCase.steps?.forEach((step: any, stepIndex: number) => {
      const row = [
        folderKey.toString(),
        escapeCSV(testCase.folder_name || "Generated Tests"),
        testKey.toString(),
        escapeCSV(testCase.test_name),
        escapeCSV(testCase.test_type || "Functionality"),
        escapeCSV(testCase.test_priority || "Medium"),
        escapeCSV(testCase.test_precondition || ""),
        "", // test_assigned_to
        "0", // test_is_automated
        "", // test_estimate
        "", // test_attachments
        "", // test_requirements
        "", // test_labels
        escapeCSV(step.step_description),
        escapeCSV(step.step_expected_result),
        (stepIndex + 1).toString(),
        "" // data_set
      ];
      
      csv += row.join(",") + "\n";
    });
  });

  return csv;
}

function escapeCSV(value: string): string {
  if (!value) return '""';
  
  const escaped = value.replace(/"/g, '""');
  
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  
  return escaped;
}
