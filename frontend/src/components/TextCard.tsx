import { Book, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TextCardProps {
  title: string;
  titleTibetan?: string;
  language: string;
  type: string;
  author?: string;
  date?: string;
  bdrcId?: string;
}

const TextCard = ({ title, titleTibetan, language, type, author, date, bdrcId }: TextCardProps) => {
  const languageColors: Record<string, string> = {
    bo: "bg-accent text-accent-foreground",
    en: "bg-secondary text-secondary-foreground",
    sa: "bg-primary text-primary-foreground",
  };

  const typeColors: Record<string, string> = {
    root: "bg-primary/10 text-primary border-primary/20",
    translation: "bg-accent/10 text-accent-foreground border-accent/20",
    commentary: "bg-secondary/10 text-secondary-foreground border-secondary/20",
  };

  return (
    <Card className="hover:shadow-elegant transition-smooth cursor-pointer group">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 group-hover:text-primary transition-smooth">
              {title}
            </CardTitle>
            {titleTibetan && (
              <p className="text-sm tibetan-text text-muted-foreground mb-3">
                {titleTibetan}
              </p>
            )}
          </div>
          <Book className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-smooth" />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge className={languageColors[language] || "bg-muted"}>
            {language.toUpperCase()}
          </Badge>
          <Badge variant="outline" className={typeColors[type]}>
            {type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {author && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{author}</span>
          </div>
        )}
        {date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{date}</span>
          </div>
        )}
        {bdrcId && (
          <div className="text-xs text-muted-foreground">
            BDRC ID: {bdrcId}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TextCard;
