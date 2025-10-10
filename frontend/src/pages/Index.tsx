import { Book, Users, FileText, Languages } from "lucide-react";
import StatCard from "@/components/StatCard";
import TextCard from "@/components/TextCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  // Sample data - will be replaced with API calls
  const recentTexts = [
    {
      title: "Heart Sutra",
      titleTibetan: "བཅོམ་ལྡན་འདས་མ་ཤེས་རབ་ཀྱི་ཕ་རོལ་ཏུ་ཕྱིན་པའི་སྙིང་པོ",
      language: "bo",
      type: "root",
      author: "Buddha Shakyamuni",
      date: "1st Century CE",
      bdrcId: "W1KG12345",
    },
    {
      title: "The Way of the Bodhisattva",
      titleTibetan: "བྱང་ཆུབ་སེམས་དཔའི་སྤྱོད་པ་ལ་འཇུག་པ",
      language: "bo",
      type: "root",
      author: "Shantideva",
      date: "8th Century",
      bdrcId: "W1KG12346",
    },
    {
      title: "Ornament of Clear Realization",
      titleTibetan: "མངོན་རྟོགས་རྒྱན",
      language: "sa",
      type: "commentary",
      author: "Maitreya",
      date: "4th Century",
      bdrcId: "W1KG12347",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      
      {/* Hero Section */}
      <section className="relative ">
        <div className="absolute inset-0 gradient-primary opacity-5"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              OpenPecha Text Cataloger
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              A comprehensive digital library system for preserving and cataloging Tibetan Buddhist 
              texts, managing authors, and facilitating scholarly research of sacred literature.
            </p>
            <div className="flex gap-4">
              <Link to="/texts">
                <Button size="lg" className="shadow-elegant">
                  <Book className="w-5 h-5 mr-2" />
                  Browse Texts
                </Button>
              </Link>
              <Link to="/search">
                <Button size="lg" variant="outline">
                  Advanced Search
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Book}
            title="Total Texts"
            value="12,847"
            description="Cataloged Buddhist texts"
            gradient
          />
          <StatCard
            icon={Users}
            title="Authors"
            value="3,256"
            description="Historical contributors"
          />
          <StatCard
            icon={FileText}
            title="Text Instances"
            value="28,432"
            description="Different editions"
          />
          <StatCard
            icon={Languages}
            title="Languages"
            value="3"
            description="Tibetan, Sanskrit, English"
          />
        </div>
      </section>

      {/* Recent Texts Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Recently Added Texts</h2>
            <p className="text-muted-foreground">
              Latest additions to the digital library
            </p>
          </div>
          <Link to="/texts">
            <Button variant="outline">View All Texts</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentTexts.map((text, index) => (
            <TextCard key={index} {...text} />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-16 mt-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
                <Book className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Text Management</h3>
              <p className="text-muted-foreground">
                Comprehensive cataloging of Tibetan Buddhist texts with rich metadata and version control
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full gradient-gold mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Author Database</h3>
              <p className="text-muted-foreground">
                Detailed records of authors, translators, and contributors with biographical information
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                <Languages className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multilingual Support</h3>
              <p className="text-muted-foreground">
                Full support for Tibetan, Sanskrit, and English with proper font rendering
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-sm">
            OpenPecha Text Cataloger - Preserving Tibetan Buddhist Heritage Through Digital Innovation
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
