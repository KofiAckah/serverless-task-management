const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Create DynamoDB client
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Put item into DynamoDB table
 */
async function putItem(tableName, item) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item
  });
  
  await docClient.send(command);
  return item;
}

/**
 * Get item from DynamoDB table
 */
async function getItem(tableName, key) {
  const command = new GetCommand({
    TableName: tableName,
    Key: key
  });
  
  const response = await docClient.send(command);
  return response.Item;
}

/**
 * Update item in DynamoDB table
 */
async function updateItem(tableName, key, updateExpression, expressionAttributeNames, expressionAttributeValues) {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  });
  
  const response = await docClient.send(command);
  return response.Attributes;
}

/**
 * Delete item from DynamoDB table
 */
async function deleteItem(tableName, key) {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key
  });
  
  await docClient.send(command);
}

/**
 * Query items from DynamoDB table
 */
async function queryItems(tableName, keyConditionExpression, expressionAttributeNames, expressionAttributeValues, indexName = null) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  };
  
  if (indexName) {
    params.IndexName = indexName;
  }
  
  const command = new QueryCommand(params);
  const response = await docClient.send(command);
  return response.Items || [];
}

/**
 * Scan all items from DynamoDB table
 */
async function scanItems(tableName) {
  const command = new ScanCommand({
    TableName: tableName
  });
  
  const response = await docClient.send(command);
  return response.Items || [];
}

/**
 * Get all assignments for a specific task
 * @param {string} taskId - The task ID
 * @returns {Promise<Array>} Array of assignment objects
 */
async function getTaskAssignments(taskId) {
  try {
    const ASSIGNMENTS_TABLE_NAME = process.env.ASSIGNMENTS_TABLE;
    
    if (!ASSIGNMENTS_TABLE_NAME) {
      console.error('ASSIGNMENTS_TABLE environment variable not set');
      return [];
    }

    const command = new QueryCommand({
      TableName: ASSIGNMENTS_TABLE_NAME,
      IndexName: 'task-index',
      KeyConditionExpression: 'taskId = :taskId',
      ExpressionAttributeValues: {
        ':taskId': taskId
      }
    });

    const response = await docClient.send(command);
    return response.Items || [];

  } catch (error) {
    console.error('Error querying task assignments:', error);
    return [];
  }
}

module.exports = {
  putItem,
  getItem,
  updateItem,
  deleteItem,
  queryItems,
  scanItems,
  getTaskAssignments
};
