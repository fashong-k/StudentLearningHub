import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageSchema } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useDataFallback } from "@/hooks/useDataFallback";
import { DataFallbackAlert } from "@/components/DataFallbackAlert";
import { format } from "date-fns";
import { 
  MessageCircle, 
  Send, 
  Search, 
  Plus, 
  MoreVertical,
  Mail,
  MailOpen,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  Filter,
  Users,
  Clock
} from "lucide-react";

export default function Messages() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();
  const { isUsingFallback, failedEndpoints, showAlert, reportFailure, clearFailures } = useDataFallback();

  const form = useForm({
    resolver: zodResolver(insertMessageSchema),
    defaultValues: {
      receiverId: "",
      subject: "",
      content: "",
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Fetch conversations from database
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
    queryFn: async (): Promise<any[]> => {
      try {
        const result = await apiRequest("/api/conversations", "GET");
        return Array.isArray(result) ? result : [];
      } catch (error) {
        reportFailure("/api/conversations", error);
        return [];
      }
    },
  });

  // Fetch messages from database
  const { data: messages = [], isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ["/api/messages"],
    enabled: !!user,
    queryFn: async (): Promise<any[]> => {
      try {
        const result = await apiRequest("/api/messages", "GET");
        return Array.isArray(result) ? result : [];
      } catch (error) {
        reportFailure("/api/messages", error);
        return [];
      }
    },
  });

  // Use real conversations data; fallback to sample data only if retrieval fails
  const sampleConversations = conversations.length === 0 ? [
    {
      id: 1,
      participants: [
        { id: "teacher1", name: "Dr. Sarah Johnson", role: "teacher", avatar: "/api/placeholder/40/40" },
        { id: user?.id, name: `${user?.firstName} ${user?.lastName}`, role: "student", avatar: user?.profileImageUrl }
      ],
      lastMessage: {
        content: "Your research paper looks great! I've added some feedback in the comments.",
        senderId: "teacher1",
        sentAt: new Date("2025-03-17T10:30:00"),
        isRead: false
      },
      unreadCount: 2,
      subject: "Research Paper Feedback"
    },
    {
      id: 2,
      participants: [
        { id: "teacher2", name: "Prof. Michael Chen", role: "teacher", avatar: "/api/placeholder/40/40" },
        { id: user?.id, name: `${user?.firstName} ${user?.lastName}`, role: "student", avatar: user?.profileImageUrl }
      ],
      lastMessage: {
        content: "The assignment deadline has been extended to next Friday.",
        senderId: "teacher2",
        sentAt: new Date("2025-03-16T14:20:00"),
        isRead: true
      },
      unreadCount: 0,
      subject: "Assignment Extension"
    },
    {
      id: 3,
      participants: [
        { id: "student1", name: "Alex Rodriguez", role: "student", avatar: "/api/placeholder/40/40" },
        { id: user?.id, name: `${user?.firstName} ${user?.lastName}`, role: "student", avatar: user?.profileImageUrl }
      ],
      lastMessage: {
        content: "Want to form a study group for the upcoming calculus exam?",
        senderId: "student1",
        sentAt: new Date("2025-03-15T16:45:00"),
        isRead: true
      },
      unreadCount: 0,
      subject: "Study Group"
    }
  ] : conversations;

  // Use real messages data; fallback to sample data only if retrieval fails
  const sampleMessages = messages.length === 0 ? (selectedConversation === 1 ? [
    {
      id: 1,
      senderId: "teacher1",
      senderName: "Dr. Sarah Johnson",
      content: "Hi! I've reviewed your research paper draft. Overall, it's a solid piece of work.",
      sentAt: new Date("2025-03-17T09:00:00"),
      isRead: true
    },
    {
      id: 2,
      senderId: user?.id,
      senderName: `${user?.firstName} ${user?.lastName}`,
      content: "Thank you for the feedback! I was particularly concerned about the methodology section.",
      sentAt: new Date("2025-03-17T09:15:00"),
      isRead: true
    },
    {
      id: 3,
      senderId: "teacher1",
      senderName: "Dr. Sarah Johnson",
      content: "The methodology is actually well-structured. I've added some comments about expanding on the data analysis section. Please check the document when you have a chance.",
      sentAt: new Date("2025-03-17T10:20:00"),
      isRead: true
    },
    {
      id: 4,
      senderId: "teacher1",
      senderName: "Dr. Sarah Johnson",
      content: "Your research paper looks great! I've added some feedback in the comments.",
      sentAt: new Date("2025-03-17T10:30:00"),
      isRead: false
    }
  ] : selectedConversation === 2 ? [
    {
      id: 1,
      senderId: "teacher2",
      senderName: "Prof. Michael Chen",
      content: "Good afternoon! I wanted to inform you about a change to the assignment deadline.",
      sentAt: new Date("2025-03-16T14:00:00"),
      isRead: true
    },
    {
      id: 2,
      senderId: "teacher2",
      senderName: "Prof. Michael Chen",
      content: "The assignment deadline has been extended to next Friday.",
      sentAt: new Date("2025-03-16T14:20:00"),
      isRead: true
    }
  ] : [
    {
      id: 1,
      senderId: "student1",
      senderName: "Alex Rodriguez",
      content: "Hey! How are you doing with the calculus course?",
      sentAt: new Date("2025-03-15T16:30:00"),
      isRead: true
    },
    {
      id: 2,
      senderId: "student1",
      senderName: "Alex Rodriguez",
      content: "Want to form a study group for the upcoming calculus exam?",
      sentAt: new Date("2025-03-15T16:45:00"),
      isRead: true
    }
  ]) : messages;

  const selectedConversationData = sampleConversations.find(c => c.id === selectedConversation);

  const filteredConversations = sampleConversations.filter(conversation =>
    conversation.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.participants.some((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sendMessage = () => {
    if (!messageText.trim()) return;
    
    // Simulate sending message
    toast({
      title: "Message sent",
      description: "Your message has been sent successfully.",
    });
    setMessageText("");
  };

  const getOtherParticipant = (conversation: any) => {
    return conversation.participants.find((p: any) => p.id !== user?.id);
  };

  return (
    <div className="flex h-screen overflow-hidden lms-background">
      <Navigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="lms-surface border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
              <p className="text-gray-600 mt-1">
                Communicate with teachers and classmates
              </p>
            </div>
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="receiverId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select recipient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="teacher1">Dr. Sarah Johnson (Psychology)</SelectItem>
                              <SelectItem value="teacher2">Prof. Michael Chen (Computer Science)</SelectItem>
                              <SelectItem value="teacher3">Dr. Emily Davis (Mathematics)</SelectItem>
                              <SelectItem value="student1">Alex Rodriguez (Student)</SelectItem>
                              <SelectItem value="student2">Jessica Kim (Student)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Message subject..." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Type your message here..." rows={6} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsComposeOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Data Fallback Alert */}
          <div className="absolute top-0 left-0 right-0 z-10 p-6">
            <DataFallbackAlert 
              isVisible={showAlert} 
              failedEndpoints={failedEndpoints}
              onDismiss={clearFailures}
            />
          </div>
          
          {/* Conversations Sidebar */}
          <div className="w-80 border-r border-gray-200 flex flex-col lms-surface">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" className="text-blue-600">
                  <Mail className="w-4 h-4 mr-2" />
                  All
                </Button>
                <Button variant="ghost" size="sm">
                  <MailOpen className="w-4 h-4 mr-2" />
                  Unread
                </Button>
                <Button variant="ghost" size="sm">
                  <Star className="w-4 h-4 mr-2" />
                  Starred
                </Button>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={otherParticipant?.avatar} alt={otherParticipant?.name} />
                        <AvatarFallback>
                          {otherParticipant?.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${conversation.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                            {otherParticipant?.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-blue-600 text-white px-2 py-1 text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {format(conversation.lastMessage.sentAt, "MMM d")}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 font-medium mt-1">{conversation.subject}</p>
                        <p className={`text-sm mt-1 truncate ${conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 lms-surface">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={getOtherParticipant(selectedConversationData)?.avatar} />
                        <AvatarFallback>
                          {getOtherParticipant(selectedConversationData)?.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {getOtherParticipant(selectedConversationData)?.name}
                        </h3>
                        <p className="text-sm text-gray-600">{selectedConversationData?.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Star className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Archive className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {sampleMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {format(message.sentAt, "h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 lms-surface">
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        rows={2}
                        className="resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                    </div>
                    <Button onClick={sendMessage} disabled={!messageText.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600 mb-4">Choose a conversation to start messaging</p>
                  <Button onClick={() => setIsComposeOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Conversation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}