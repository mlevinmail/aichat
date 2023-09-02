export class OpenAIChat {
    constructor(apiKey = '', initialSystemMessage = 'You are a helpful assistant during a voice chat.') {
      this.apiKey = apiKey;
      this.messages = [];
  
      if (initialSystemMessage) {
        this.addSystemMessage(initialSystemMessage);
      }
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }
  
    addSystemMessage(content) {
      this.messages.push({
        role: 'system',
        content: content
      });
    }
  
    addUserMessage(content) {
      this.messages.push({
        role: 'user',
        content: content
      });
    }
  
    async getResponse() {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: this.messages
        })
      });
  
      const data = await response.json();
  
      if (data && data.choices && data.choices.length > 0) {
        const message = data.choices[0].message;
        this.messages.push({
          role: message.role,
          content: message.content
        });
        return message.content;
      } else {
        throw new Error('Failed to get a valid response from the OpenAI API.');
      }
    }
  
    resetChat() {
      this.messages = [];
    }
  }

  